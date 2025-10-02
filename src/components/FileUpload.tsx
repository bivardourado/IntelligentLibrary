import { Plus } from 'lucide-react';
import { useDropzone, DropzoneInputProps } from 'react-dropzone'; // Importa DropzoneInputProps
import { DetailedHTMLProps, InputHTMLAttributes } from 'react'; // Importa tipos do React

type Props = {
  onDrop: (acceptedFiles: File[]) => void;
};

// ==================================================================
// SOLUÇÃO ELEGANTE SUGERIDA PELO COPILOT
// Criamos uma interface que une as propriedades do input HTML
// com as propriedades que o react-dropzone adiciona.
// ==================================================================
interface CustomInputProps extends DropzoneInputProps, DetailedHTMLProps<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement> {
  refKey?: string;
}

const FileUpload = ({ onDrop }: Props) => {
  // @ts-ignore - Este ignore ainda é útil para o erro principal do useDropzone
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
    },
    multiple: true,
  });

  // Agora, informamos ao TypeScript que getInputProps() retorna nosso tipo customizado
  const inputProps: CustomInputProps = getInputProps();

  return (
    <div
      {...getRootProps()}
      className={`flex flex-col items-center justify-center w-full p-8 border-2 border-dashed rounded-lg cursor-pointer transition-colors
      ${isDragActive ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-300 dark:border-gray-600 hover:border-gray-400 dark:hover:border-gray-500'}`}
    >
      {/* O input agora aceita as propriedades sem reclamar */}
      <input {...inputProps} />
      
      <Plus className="w-8 h-8 text-gray-400" />
      <p className="mt-2 text-md font-semibold text-gray-700 dark:text-gray-300">
        Clique ou arraste arquivos PDF aqui
      </p>
      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
        Suporte a múltiplos arquivos
      </p>
    </div>
  );
};

export default FileUpload;
