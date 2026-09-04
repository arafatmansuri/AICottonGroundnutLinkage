import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiApi, marketApi } from '../../api';
import type { CloudinaryUploadParams } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../../utils';
import { Star, AlertTriangle, Image, Loader2, CloudUpload } from 'lucide-react';
import toast from 'react-hot-toast';

type UploadStep = 'idle' | 'signing' | 'uploading' | 'analyzing' | 'done' | 'error';

const STEP_LABELS: Record<UploadStep, string> = {
  idle: '',
  signing: 'Getting upload credentials…',
  uploading: 'Uploading image to cloud…',
  analyzing: 'AI is analyzing crop quality…',
  done: '',
  error: '',
};

/**
 * Upload the file directly to Cloudinary using the signed parameters
 * returned by the backend. Returns the secure_url of the uploaded image.
 */
async function uploadToCloudinary(
  file: File,
  params: CloudinaryUploadParams,
): Promise<string> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('api_key', params.apiKey);
  formData.append('timestamp', String(params.timestamp));
  formData.append('signature', params.signature);
  formData.append('folder', params.folder);
  // The public_id sent to Cloudinary must be just the base name (without folder prefix)
  // because folder is already a separate field.
  const basePublicId = params.publicId.replace(`${params.folder}/`, '');
  formData.append('public_id', basePublicId);

  const res = await fetch(params.uploadUrl, { method: 'POST', body: formData });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Cloudinary upload failed: ${text}`);
  }
  const data = await res.json() as { secure_url: string };
  return data.secure_url;
}

export default function QualityCheckPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropType, setCropType] = useState('Cotton');
  const [result, setResult] = useState<any>(null);
  const [step, setStep] = useState<UploadStep>('idle');
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: crops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const gradeMutation = useMutation({
    mutationFn: async () => {
      // ── Step 1: Get signed upload credentials from backend ──────────────
      setStep('signing');
      const { data: uploadParams } = await aiApi.getUploadUrl().then(r => r.data);

      // ── Step 2a: Upload image directly to Cloudinary from the browser ───
      setStep('uploading');
      let imageUrl: string | undefined;
      if (selectedFile) {
        imageUrl = await uploadToCloudinary(selectedFile, uploadParams);
      }

      // ── Step 2b: Ask backend to run AI grading with the image URL ────────
      setStep('analyzing');
      const gradeResult = await aiApi
        .gradeQuality({ cropType, imageUrl })
        .then(r => r.data.data);

      // ── Step 3: Delete the image from Cloudinary (fire-and-forget) ───────
      if (imageUrl && uploadParams.publicId) {
        aiApi.deleteImage(uploadParams.publicId).catch(() => {
          // Non-fatal — Cloudinary cleanup failure should not surface to user
        });
      }

      setStep('done');
      return gradeResult;
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success('Quality assessment complete!');
    },
    onError: (err) => {
      setStep('error');
      console.error(err);
      toast.error('Quality assessment failed. Please try again.');
    },
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('File too large. Max 10MB.');
      return;
    }
    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
    setResult(null);
    setStep('idle');
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
      setStep('idle');
    }
  };

  const handleClear = () => {
    setSelectedFile(null);
    setPreviewUrl(null);
    setResult(null);
    setStep('idle');
  };

  const isPending = gradeMutation.isPending;

  const gradeColors: Record<string, string> = {
    GRADE_A: 'text-green-700 bg-green-100 border-green-300',
    GRADE_B: 'text-blue-700 bg-blue-100 border-blue-300',
    GRADE_C: 'text-yellow-700 bg-yellow-100 border-yellow-300',
    UNGRADED: 'text-gray-600 bg-gray-100 border-gray-300',
  };

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">AI Quality Check</h1>
        <div className="flex items-center gap-2">
          <div className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200">
            AI Vision Analysis
          </div>
          <div className="text-xs bg-sky-50 text-sky-700 px-3 py-1.5 rounded-full border border-sky-200 flex items-center gap-1">
            <CloudUpload className="w-3 h-3" />
            Cloudinary
          </div>
        </div>
      </div>

      {/* Upload area */}
      <div className="card">
        <div className="mb-4">
          <label className="label">Crop Type</label>
          <select className="input max-w-[200px] text-sm" value={cropType}
            onChange={e => setCropType(e.target.value)}>
            {crops?.map((c: any) => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
        </div>

        <div
          onDrop={handleDrop} onDragOver={e => e.preventDefault()}
          onClick={() => !isPending && fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center transition-colors ${
            isPending
              ? 'border-purple-200 bg-purple-50/30 cursor-wait'
              : previewUrl
                ? 'border-green-300 bg-green-50/30 cursor-pointer'
                : 'border-gray-200 hover:border-green-400 hover:bg-green-50/20 cursor-pointer'
          }`}
        >
          {previewUrl ? (
            <div className="space-y-3">
              <img src={previewUrl} alt="Crop preview" className="max-h-48 mx-auto rounded-xl object-cover" />
              <p className="text-sm text-gray-500">{selectedFile?.name}</p>
            </div>
          ) : (
            <>
              <div className="w-14 h-14 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
                <Image className="w-7 h-7 text-gray-400" />
              </div>
              <p className="text-gray-700 font-medium">Drop crop image here</p>
              <p className="text-sm text-gray-400 mt-1">or click to browse • JPG, PNG, WEBP • Max 10MB</p>
            </>
          )}
        </div>
        <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png,.webp" className="hidden"
          onChange={handleFileChange} />

        {/* Progress indicator */}
        {isPending && step !== 'idle' && (
          <div className="mt-3 flex items-center gap-2 text-sm text-purple-700 bg-purple-50 rounded-lg px-4 py-2.5 border border-purple-100">
            <Loader2 className="w-4 h-4 animate-spin flex-shrink-0" />
            <span>{STEP_LABELS[step]}</span>
          </div>
        )}

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => gradeMutation.mutate()}
            disabled={isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Star className="w-4 h-4" /> Analyze Quality</>
            )}
          </button>
          {previewUrl && !isPending && (
            <button onClick={handleClear} className="btn-secondary">Clear</button>
          )}
        </div>
      </div>

      {/* Result */}
      {result && (
        <div className="card border-2 border-purple-100">
          <h2 className="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-purple-600" />
            Quality Assessment Result
          </h2>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Estimated Grade</p>
              <div className={`inline-flex items-center gap-1 text-lg font-bold px-4 py-2 rounded-xl border ${gradeColors[result.estimatedGrade]}`}>
                {result.estimatedGrade.replace('_', ' ')}
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Confidence</p>
              <p className="text-2xl font-bold text-gray-800">{Math.round(result.confidence * 100)}%</p>
              <div className="h-1.5 bg-gray-200 rounded-full mt-2">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: `${result.confidence * 100}%` }} />
              </div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-xl">
              <p className="text-xs text-gray-500 mb-1">Estimated Price</p>
              <p className="text-base font-bold text-gray-800">
                {formatCurrency(result.estimatedPriceRange.min)} – {formatCurrency(result.estimatedPriceRange.max)}
              </p>
              <p className="text-xs text-gray-400">per quintal</p>
            </div>
          </div>

          <div className="mb-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Observations:</p>
            <div className="space-y-1">
              {result.observations?.map((obs: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm text-gray-700">
                  <span className="text-purple-500 mt-0.5">•</span>
                  <span>{obs}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex items-start gap-2 text-xs text-amber-700 bg-amber-50 rounded-xl px-4 py-3 border border-amber-100">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <span>{result.warning}</span>
          </div>
        </div>
      )}

      {/* Info */}
      <div className="card bg-purple-50/30 border-purple-100">
        <h3 className="font-medium text-gray-800 mb-2">What does AI quality check analyze?</h3>
        <div className="grid md:grid-cols-2 gap-4 text-sm text-gray-600">
          <div>
            <p className="font-medium text-gray-700 mb-1">Cotton:</p>
            <ul className="space-y-0.5">
              {['Visible contamination', 'Color uniformity', 'Boll appearance', 'General visible characteristics'].map(i => (
                <li key={i} className="flex items-center gap-1"><span className="text-purple-500">•</span>{i}</li>
              ))}
            </ul>
          </div>
          <div>
            <p className="font-medium text-gray-700 mb-1">Groundnut:</p>
            <ul className="space-y-0.5">
              {['Kernel size uniformity', 'Visible damage', 'Discoloration', 'Mold indicators'].map(i => (
                <li key={i} className="flex items-center gap-1"><span className="text-purple-500">•</span>{i}</li>
              ))}
            </ul>
          </div>
        </div>
        <p className="mt-3 text-xs text-gray-400">
          Images are uploaded directly to Cloudinary and automatically deleted after analysis.
          No image data is stored on our servers.
        </p>
      </div>
    </div>
  );
}
