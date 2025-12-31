import React from 'react';
import { Download } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  onClick: () => void;
}

export const PdfButton: React.FC<Props> = ({ onClick }) => (
  <Button onClick={onClick} className="h-10 gap-2">
    <Download className="h-4 w-4" />
    <span className="hidden sm:inline">Télécharger le PDF</span>
    <span className="sr-only">Télécharger le PDF</span>
  </Button>
);

export default PdfButton;
