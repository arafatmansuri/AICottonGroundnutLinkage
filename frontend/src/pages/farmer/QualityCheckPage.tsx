import React, { useState, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { aiApi, marketApi } from '../../api';
import { useQuery } from '@tanstack/react-query';
import { formatCurrency } from '../../utils';
import { Star, AlertTriangle, Image, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';

export default function QualityCheckPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [cropType, setCropType] = useState('Cotton');
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const { data: crops } = useQuery({
    queryKey: ['allCrops'],
    queryFn: () => marketApi.getCrops().then(r => r.data.data),
  });

  const gradeMutation = useMutation({
    mutationFn: async () => {
      const formData = new FormData();
      formData.append('cropType', cropType);
      if (selectedFile) formData.append('image', selectedFile);
      return aiApi.gradeQuality(formData).then(r => r.data.data);
    },
    onSuccess: (data) => {
      setResult(data);
      toast.success('Quality assessment complete!');
    },
    onError: () => toast.error('Quality assessment failed. Please try again.'),
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
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && ['image/jpeg', 'image/png', 'image/webp'].includes(file.type)) {
      setSelectedFile(file);
      setPreviewUrl(URL.createObjectURL(file));
      setResult(null);
    }
  };

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
        <div className="text-xs bg-purple-50 text-purple-700 px-3 py-1.5 rounded-full border border-purple-200">
          AI Vision Analysis
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
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-colors ${
            previewUrl ? 'border-green-300 bg-green-50/30' : 'border-gray-200 hover:border-green-400 hover:bg-green-50/20'
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

        <div className="mt-4 flex gap-3">
          <button
            onClick={() => gradeMutation.mutate()}
            disabled={gradeMutation.isPending}
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
          >
            {gradeMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
            ) : (
              <><Star className="w-4 h-4" /> Analyze Quality</>
            )}
          </button>
          {previewUrl && (
            <button onClick={() => { setSelectedFile(null); setPreviewUrl(null); setResult(null); }}
              className="btn-secondary">Clear</button>
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
      </div>
    </div>
  );
}
