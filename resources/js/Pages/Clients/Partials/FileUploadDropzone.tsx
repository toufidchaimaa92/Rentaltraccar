import React, { useRef } from 'react';
import {
  FileUploader,
  FileInput,
  FileUploaderContent,
} from '@/components/ui/file-upload';
import { DropzoneOptions } from 'react-dropzone';
import { X } from 'lucide-react';

const FileSvgDraw = () => (
  <>
    <svg
      className="w-8 h-8 mb-3 text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 20 16"
    >
      <path
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="2"
        d="M13 13h3a3 3 0 0 0 0-6h-.025A5.56 5.56 0 0 0 16 6.5 5.5 5.5 0 0 0 5.207 5.021C5.137 5.017 5.071 5 5 5a4 4 0 0 0 0 8h2.167M10 15V6m0 0L8 8m2-2 2 2"
      />
    </svg>
    <p className="mb-1 text-sm text-primary">
      <span className="font-semibold">Cliquez pour téléverser</span> ou glissez-déposez
    </p>
  </>
);

interface FileUploadDropzoneProps {
  existingFiles?: { id: number; url: string }[];
  onRemoveInitialFile?: (id: number) => void;
  files?: File[];
  setFiles?: (files: File[]) => void;
  onReorderExisting?: (newOrder: { id: number; url: string }[]) => void;
  onReorderNew?: (newOrder: File[]) => void;
}

const FileUploadDropzone: React.FC<FileUploadDropzoneProps> = ({
  existingFiles = [],
  onRemoveInitialFile = () => {},
  files = [],
  setFiles = () => {},
  onReorderExisting = () => {},
  onReorderNew = () => {},
}) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleRemoveNew = (index: number) => {
    const updated = [...files];
    updated.splice(index, 1);
    setFiles(updated);
  };

  const handleRemoveExisting = (index: number) => {
    const removed = existingFiles[index];
    onRemoveInitialFile(removed.id);
  };

  const handleSortExisting = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const updated = [...existingFiles];
      const dragged = updated[dragItem.current];
      updated.splice(dragItem.current, 1);
      updated.splice(dragOverItem.current, 0, dragged);
      onReorderExisting(updated);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const handleSortNew = () => {
    if (dragItem.current !== null && dragOverItem.current !== null) {
      const updated = [...files];
      const dragged = updated[dragItem.current];
      updated.splice(dragItem.current, 1);
      updated.splice(dragOverItem.current, 0, dragged);
      onReorderNew(updated);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const dropzoneOptions: DropzoneOptions = {
    accept: { 'image/*': ['.jpg', '.jpeg', '.png', '.gif'] },
    multiple: true,
    maxFiles: 4,
    maxSize: 5 * 1024 * 1024, // 5MB to match backend
  };

  return (
    <FileUploader
      value={files}
      orientation="vertical"
      onValueChange={setFiles}
      dropzoneOptions={dropzoneOptions}
      className="relative rounded-lg p-2 w-full"
    >
      <FileInput className="outline-dashed bg-background outline-2 outline-primary/40">
        <div className="flex items-center justify-center flex-col pt-3 pb-4 w-full">
          <FileSvgDraw />
        </div>
      </FileInput>

      <div className="flex gap-2 mt-2 flex-wrap">
        {existingFiles.map((img, index) => (
          <div
            key={`existing-${img.id}`}
            className="relative size-20 p-0 rounded-md overflow-hidden border border-border bg-card"
            draggable
            onDragStart={() => (dragItem.current = index)}
            onDragEnter={() => (dragOverItem.current = index)}
            onDragEnd={handleSortExisting}
            onDragOver={(e) => e.preventDefault()}
          >
            <img
              src={img.url}
              alt={`existing-${index}`}
              className="size-20 rounded-md object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemoveExisting(index)}
              className="absolute top-1 right-1 rounded-full border border-border bg-card/80 p-1 hover:bg-card"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </div>

      <FileUploaderContent className="flex items-center flex-row gap-2 mt-2 flex-wrap">
        {files.map((file, index) => (
          <div
            key={`new-${index}`}
            className="relative size-20 p-0 rounded-md overflow-hidden border border-border bg-card"
            draggable
            onDragStart={() => (dragItem.current = index)}
            onDragEnter={() => (dragOverItem.current = index)}
            onDragEnd={handleSortNew}
            onDragOver={(e) => e.preventDefault()}
          >
            <img
              src={URL.createObjectURL(file)}
              alt={file.name}
              className="size-20 rounded-md object-cover"
            />
            <button
              type="button"
              onClick={() => handleRemoveNew(index)}
              className="absolute top-1 right-1 rounded-full border border-border bg-card/80 p-1 hover:bg-card"
            >
              <X size={14} />
            </button>
          </div>
        ))}
      </FileUploaderContent>
    </FileUploader>
  );
};

export default FileUploadDropzone;