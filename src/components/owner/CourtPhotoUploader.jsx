import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Upload, X, Image, Loader2, GripVertical } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function CourtPhotoUploader({ photos = [], onPhotosChange, maxPhotos = 10 }) {
  const [uploading, setUploading] = useState(false);
  const [draggedIndex, setDraggedIndex] = useState(null);

  const handleFileSelect = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;

    const remaining = maxPhotos - photos.length;
    if (remaining <= 0) {
      toast.error(`Máximo ${maxPhotos} fotos permitidas`);
      return;
    }

    const filesToUpload = files.slice(0, remaining);
    setUploading(true);

    try {
      const uploadPromises = filesToUpload.map(file => 
        base44.integrations.Core.UploadFile({ file })
      );
      const results = await Promise.all(uploadPromises);
      const newUrls = results.map(r => r.file_url);
      onPhotosChange([...photos, ...newUrls]);
      toast.success(`${newUrls.length} foto${newUrls.length > 1 ? 's' : ''} subida${newUrls.length > 1 ? 's' : ''}`);
    } catch (error) {
      toast.error("Error al subir las fotos");
    } finally {
      setUploading(false);
      e.target.value = '';
    }
  };

  const handleRemove = (index) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    onPhotosChange(newPhotos);
  };

  const handleDragStart = (e, index) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e, index) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === index) return;
    
    const newPhotos = [...photos];
    const [draggedItem] = newPhotos.splice(draggedIndex, 1);
    newPhotos.splice(index, 0, draggedItem);
    onPhotosChange(newPhotos);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-700">
          Fotos de la cancha ({photos.length}/{maxPhotos})
        </p>
        {photos.length > 1 && (
          <p className="text-xs text-slate-500">Arrastra para reordenar</p>
        )}
      </div>

      {/* Photo Grid */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((url, index) => (
            <div
              key={url}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative aspect-square rounded-lg overflow-hidden group cursor-move border-2 ${
                draggedIndex === index ? 'border-teal-500 opacity-50' : 'border-transparent'
              } ${index === 0 ? 'ring-2 ring-teal-500' : ''}`}
            >
              <img
                src={url}
                alt={`Foto ${index + 1}`}
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-colors" />
              <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <GripVertical className="h-4 w-4 text-white drop-shadow" />
              </div>
              <button
                type="button"
                onClick={() => handleRemove(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
              >
                <X className="h-3 w-3" />
              </button>
              {index === 0 && (
                <span className="absolute bottom-1 left-1 text-[10px] bg-teal-600 text-white px-1.5 py-0.5 rounded">
                  Principal
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Upload Button */}
      {photos.length < maxPhotos && (
        <label className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-xl cursor-pointer transition-colors ${
          uploading ? 'border-slate-300 bg-slate-50' : 'border-slate-300 hover:border-teal-500 hover:bg-teal-50'
        }`}>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center">
              <Loader2 className="h-8 w-8 text-teal-600 animate-spin mb-2" />
              <p className="text-sm text-slate-500">Subiendo...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-full bg-slate-100 flex items-center justify-center mb-2">
                <Upload className="h-6 w-6 text-slate-400" />
              </div>
              <p className="text-sm text-slate-600 font-medium">Subir fotos</p>
              <p className="text-xs text-slate-400 mt-1">PNG, JPG hasta 10MB</p>
            </div>
          )}
        </label>
      )}

      {photos.length === 0 && (
        <p className="text-xs text-slate-500 text-center">
          La primera foto será la imagen principal de tu cancha
        </p>
      )}
    </div>
  );
}