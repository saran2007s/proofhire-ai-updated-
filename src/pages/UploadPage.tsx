import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Input } from '../components/ui/input';
import { UploadCloud, Loader2 } from 'lucide-react';

export default function UploadPage() {
  const [jobDescription, setJobDescription] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const navigate = useNavigate();

  const handleAnalyze = async () => {
    if (!jobDescription) {
      alert('Please enter a job description before analyzing.');
      return;
    }
    if (!files || files.length === 0) {
      alert('Please upload at least one resume file.');
      return;
    }

    setIsAnalyzing(true);
    
    const formData = new FormData();
    formData.append('jobDescription', jobDescription);
    for (let i = 0; i < files.length; i++) {
      formData.append('resumes', files[i]);
    }

    try {
      const response = await fetch('/api/analyze', {
        method: 'POST',
        body: formData,
      });

      if (response.ok) {
        navigate('/results');
      } else {
        const err = await response.json();
        alert('Error: ' + err.error);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to analyze resumes.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">Upload Candidates</h2>
        <p className="text-zinc-500 mt-2">Upload resumes and provide a job description for AI analysis.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Job Description</CardTitle>
          <CardDescription>Paste the job description or required skills here.</CardDescription>
        </CardHeader>
        <CardContent>
          <Textarea 
            placeholder="e.g. We are looking for a Senior React Developer with experience in Node.js, TypeScript, and AWS..."
            className="min-h-[200px]"
            value={jobDescription}
            onChange={(e) => setJobDescription(e.target.value)}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Resumes</CardTitle>
          <CardDescription>Upload multiple .txt resume files.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="border-2 border-dashed border-zinc-200 rounded-xl p-10 flex flex-col items-center justify-center text-center bg-zinc-50/50">
            <UploadCloud className="w-10 h-10 text-zinc-400 mb-4" />
            <p className="text-sm font-medium text-zinc-900 mb-1">Click to upload or drag and drop</p>
            <p className="text-xs text-zinc-500 mb-4">TXT files only (max 20 files)</p>
            <Input 
              type="file" 
              multiple 
              accept=".txt" 
              className="max-w-xs"
              onChange={(e) => setFiles(e.target.files)}
            />
            {files && files.length > 0 && (
              <p className="mt-4 text-sm text-emerald-600 font-medium">
                {files.length} file(s) selected
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button 
          size="lg" 
          onClick={handleAnalyze} 
          disabled={isAnalyzing}
        >
          {isAnalyzing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Analyzing Candidates...
            </>
          ) : (
            'Analyze Candidates'
          )}
        </Button>
      </div>
    </div>
  );
}
