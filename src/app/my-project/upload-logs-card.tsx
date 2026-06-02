"use client";

import {
  AlertCircle,
  CheckCircle2,
  FileJson,
  Loader2,
  Upload,
} from "lucide-react";
import { useCallback, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface LogFile {
  path: string;
  content: string;
  size: number;
}

interface SanitizationResult {
  sanitized: string;
  redactedCount: number;
  patterns: string[];
}

export function UploadLogsCard({ projectId }: { projectId: string }) {
  const [files, setFiles] = useState<LogFile[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadResult, setUploadResult] = useState<{
    success: boolean;
    message: string;
    metadata?: {
      filesCount: number;
      totalSize: number;
      redactedCount: number;
    };
  } | null>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const items = Array.from(e.dataTransfer.items);
    const logFiles: LogFile[] = [];

    for (const item of items) {
      if (item.kind === "file") {
        const file = item.getAsFile();
        if (file?.name.endsWith(".json")) {
          const content = await file.text();
          logFiles.push({
            path: file.name,
            content,
            size: file.size,
          });
        }
      }
    }

    setFiles(logFiles);
    setUploadResult(null);
  }, []);

  const handleFileSelect = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFiles = Array.from(e.target.files || []);
      const logFiles: LogFile[] = [];

      for (const file of selectedFiles) {
        if (file.name.endsWith(".json")) {
          const content = await file.text();
          logFiles.push({
            path: file.name,
            content,
            size: file.size,
          });
        }
      }

      setFiles(logFiles);
      setUploadResult(null);
    },
    [],
  );

  const sanitizeLog = (content: string): SanitizationResult => {
    const patterns = [
      {
        name: "GitHub Token",
        pattern: /\b(ghp|gho|ghu|ghs|ghr)_[A-Za-z0-9_]{36,255}\b/gi,
        replacement: "[REDACTED_GITHUB_TOKEN]",
      },
      {
        name: "Bearer Token",
        pattern: /\b[Bb]earer\s+[A-Za-z0-9\-._~+/]+=*/gi,
        replacement: "Bearer [REDACTED_TOKEN]",
      },
      {
        name: "JWT Token",
        pattern: /\beyJ[A-Za-z0-9_-]*\.eyJ[A-Za-z0-9_-]*\.[A-Za-z0-9_-]*/gi,
        replacement: "[REDACTED_JWT]",
      },
      {
        name: "Email Address",
        pattern: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/gi,
        replacement: "[REDACTED_EMAIL]",
      },
      {
        name: "API Key",
        pattern:
          /\b[Aa][Pp][Ii][-_]?[Kk][Ee][Yy]\s*[:=]\s*['"]?([A-Za-z0-9_-]{20,})/gi,
        replacement: "api_key=[REDACTED_API_KEY]",
      },
      {
        name: "Password",
        pattern: /\b[Pp]assword\s*[:=]\s*['"]?([^\s'"]{6,})/gi,
        replacement: "password=[REDACTED_PASSWORD]",
      },
      {
        name: "Windows Path",
        pattern: /\bC:\\Users\\[^\s\\]+/gi,
        replacement: "C:\\Users\\[REDACTED_USER]",
      },
      {
        name: "Unix Home Path",
        pattern: /\/home\/[^\s/]+/gi,
        replacement: "/home/[REDACTED_USER]",
      },
      {
        name: "Mac Home Path",
        pattern: /\/Users\/[^\s/]+/gi,
        replacement: "/Users/[REDACTED_USER]",
      },
    ];

    let sanitized = content;
    let redactedCount = 0;
    const triggeredPatterns: string[] = [];

    for (const { name, pattern, replacement } of patterns) {
      const matches = sanitized.match(pattern);
      if (matches && matches.length > 0) {
        sanitized = sanitized.replace(pattern, replacement);
        redactedCount += matches.length;
        triggeredPatterns.push(name);
      }
    }

    return {
      sanitized,
      redactedCount,
      patterns: [...new Set(triggeredPatterns)],
    };
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const sanitizedLogs = files.map((file) => {
        const result = sanitizeLog(file.content);
        return {
          path: file.path,
          content: result.sanitized,
        };
      });

      setUploadProgress(30);

      const response = await fetch(`/api/projects/${projectId}/upload-logs`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          logs: sanitizedLogs,
        }),
      });

      setUploadProgress(80);

      const result = await response.json();

      setUploadProgress(100);

      if (response.ok) {
        setUploadResult({
          success: true,
          message: result.message || "Логи успешно загружены!",
          metadata: result.metadata,
        });
        setFiles([]);
      } else {
        setUploadResult({
          success: false,
          message: result.error || "Ошибка загрузки логов",
        });
      }
    } catch (error) {
      setUploadResult({
        success: false,
        message: error instanceof Error ? error.message : "Неизвестная ошибка",
      });
    } finally {
      setIsUploading(false);
      setTimeout(() => setUploadProgress(0), 1000);
    }
  };

  const totalSize = files.reduce((sum, file) => sum + file.size, 0);
  const totalSizeMB = (totalSize / 1024 / 1024).toFixed(2);

  return (
    <Card className="glass border-border/80 bg-card/65 backdrop-blur-md shadow-sm">
      <CardHeader>
        <CardTitle className="text-base font-bold text-foreground">
          Загрузка логов OpenCode
        </CardTitle>
        <p className="text-xs leading-relaxed text-muted-foreground font-medium mt-1">
          Перетащите файлы логов из папок <code>.ai-coach/logs/</code> или{" "}
          <code>.opencode-logs/</code> для анализа AI Engineering Coach.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadResult && (
          <div
            className={`rounded-lg border p-4 ${
              uploadResult.success
                ? "border-[hsl(var(--status-success)/0.25)] bg-[hsl(var(--status-success)/0.08)]"
                : "border-destructive/20 bg-destructive/10"
            }`}
          >
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle2 className="size-5 text-[hsl(var(--status-success))] shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="size-5 text-destructive shrink-0 mt-0.5" />
              )}
              <div className="flex-1 text-sm">
                <div className="font-semibold text-foreground">
                  {uploadResult.message}
                </div>
                {uploadResult.metadata && (
                  <div className="mt-2 text-xs text-muted-foreground font-medium">
                    Загружено файлов: {uploadResult.metadata.filesCount} •
                    Размер:{" "}
                    {(uploadResult.metadata.totalSize / 1024 / 1024).toFixed(2)}
                    MB
                    {uploadResult.metadata.redactedCount > 0 && (
                      <>
                        {" "}
                        • Удалено чувствительных данных:{" "}
                        {uploadResult.metadata.redactedCount}
                      </>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <label
          htmlFor="file-upload"
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`block rounded-lg border-2 border-dashed p-8 text-center cursor-pointer transition-colors ${
            isDragging
              ? "border-[hsl(var(--status-calm))] bg-[hsl(var(--status-calm)/0.08)]"
              : "border-border bg-background/50 hover:bg-background-secondary"
          }`}
        >
          <Upload className="mx-auto size-10 text-muted-foreground" />
          <div className="mt-4 text-sm font-semibold text-foreground">
            Перетащите файлы логов сюда
          </div>
          <div className="mt-1 text-xs text-muted-foreground font-medium">
            или выберите файлы вручную
          </div>
          <div className="mt-4">
            <Button variant="outline" asChild>
              <span>Выбрать файлы</span>
            </Button>
            <input
              id="file-upload"
              type="file"
              multiple
              accept=".json"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>
          <div className="mt-4 text-[10px] text-muted-foreground font-medium">
            Принимаются только .json файлы • Максимум 150 файлов • До 10MB
            каждый
          </div>
        </label>

        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-semibold">
              <div className="text-foreground">
                Выбрано файлов: {files.length}
              </div>
              <div className="text-muted-foreground">
                Общий размер: {totalSizeMB}MB
              </div>
            </div>

            <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-border bg-background-secondary p-3">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center gap-2 text-xs font-medium"
                >
                  <FileJson className="size-4 text-muted-foreground shrink-0" />
                  <span className="flex-1 truncate text-foreground">
                    {file.path}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    {(file.size / 1024).toFixed(1)}KB
                  </span>
                </div>
              ))}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <div className="text-center text-xs text-muted-foreground font-semibold">
                  Загрузка... {uploadProgress}%
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 size-4 animate-spin" />
                  Загрузка...
                </>
              ) : (
                "Загрузить логи"
              )}
            </Button>

            <div className="rounded-lg border border-[hsl(var(--status-calm)/0.25)] bg-[hsl(var(--status-calm)/0.08)] p-3 text-xs leading-relaxed text-muted-foreground font-medium">
              🔒 Все чувствительные данные (токены, пароли, email) автоматически
              удаляются перед отправкой.
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
