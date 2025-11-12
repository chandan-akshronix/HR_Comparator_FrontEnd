import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { Label } from './ui/label';

interface JobDescriptionUploadProps {
  onUpload: (description: string) => void;
}

export function JobDescriptionUpload({ onUpload }: JobDescriptionUploadProps) {
  const [description, setDescription] = useState('');
  const [isUploaded, setIsUploaded] = useState(false);

  const handleUpload = () => {
    if (description.trim()) {
      onUpload(description);
      setIsUploaded(true);
      setTimeout(() => setIsUploaded(false), 3000);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // In real app, this would read the file content
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setDescription(content);
      };
      reader.readAsText(file);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="w-5 h-5" />
          Job Description
        </CardTitle>
        <CardDescription>
          Upload or paste the job description to compare with candidate resumes
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="file-upload">Upload File (PDF, DOCX, TXT)</Label>
          <div className="flex gap-2">
            <Input
              id="file-upload"
              type="file"
              accept=".pdf,.doc,.docx,.txt"
              onChange={handleFileUpload}
              className="flex-1"
            />
          </div>
        </div>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t" />
          </div>
          <div className="relative flex justify-center text-xs uppercase">
            <span className="bg-white px-2 text-muted-foreground">Or paste description</span>
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Job Description Text</Label>
          <Textarea
            id="description"
            placeholder="Paste job description here...&#10;&#10;Example:&#10;Position: Senior Software Engineer&#10;Required Skills: React, TypeScript, Node.js&#10;Experience: 5+ years&#10;Location: Remote"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={8}
            className="resize-none"
          />
        </div>

        <Button 
          onClick={handleUpload} 
          disabled={!description.trim()}
          className="w-full"
        >
          {isUploaded ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Uploaded Successfully
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Upload & Start AI Comparison
            </>
          )}
        </Button>
      </CardContent>
    </Card>
  );
}

// Add Input component import if missing
function Input({ className, ...props }: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={`flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 ring-offset-background file:border-0 file:bg-transparent file:text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}
