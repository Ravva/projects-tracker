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
    // Импортируем паттерны санитизации из log-sanitizer
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
      // Санитизация логов на клиенте
      const sanitizedLogs = files.map((file) => {
        const result = sanitizeLog(file.content);
        return {
          path: file.path,
          content: result.sanitized,
        };
      });

      setUploadProgress(30);

      // Отправка на сервер
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
    <Card className="border-border/70 bg-card/88 shadow-none">
      <CardHeader>
        <CardTitle className="text-base">Загрузка логов OpenCode</CardTitle>
        <p className="text-sm text-muted-foreground">
          Перетащите файлы логов из папок <code>.ai-coach/logs/</code> или{" "}
          <code>.opencode-logs/</code> для анализа AI Engineering Coach
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {uploadResult && (
          <div
            className={`rounded-2xl border p-4 ${
              uploadResult.success
                ? "border-[hsl(var(--status-success)/0.3)] bg-[hsl(var(--status-success)/0.08)]"
                : "border-destructive/30 bg-destructive/10"
            }`}
          >
            <div className="flex items-start gap-3">
              {uploadResult.success ? (
                <CheckCircle2 className="size-5 text-[hsl(var(--status-success))]" />
              ) : (
                <AlertCircle className="size-5 text-destructive" />
              )}
              <div className="flex-1">
                <div className="font-medium">{uploadResult.message}</div>
                {uploadResult.metadata && (
                  <div className="mt-2 text-sm text-muted-foreground">
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
          className={`rounded-2xl border-2 border-dashed p-8 text-center transition-colors ${
            isDragging
              ? "border-[hsl(var(--status-calm))] bg-[hsl(var(--status-calm)/0.08)]"
              : "border-border/70 bg-background/50"
          }`}
        >
          <Upload className="mx-auto size-12 text-muted-foreground" />
          <div className="mt-4 text-sm font-medium">
            Перетащите файлы логов сюда
          </div>
          <div className="mt-2 text-sm text-muted-foreground">
            или выберите файлы вручную
          </div>
          <div className="mt-4">
            <Button variant="outline" className="rounded-xl" asChild>
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
          <div className="mt-4 text-xs text-muted-foreground">
            Принимаются только .json файлы • Максимум 150 файлов • До 10MB
            каждый
          </div>
        </label>

        {files.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium">
                Выбрано файлов: {files.length}
              </div>
              <div className="text-sm text-muted-foreground">
                Общий размер: {totalSizeMB}MB
              </div>
            </div>

            <div className="max-h-48 space-y-2 overflow-y-auto rounded-xl border border-border/70 bg-background/50 p-3">
              {files.map((file) => (
                <div
                  key={file.path}
                  className="flex items-center gap-2 text-sm"
                >
                  <FileJson className="size-4 text-muted-foreground" />
                  <span className="flex-1 truncate">{file.path}</span>
                  <span className="text-xs text-muted-foreground">
                    {(file.size / 1024).toFixed(1)}KB
                  </span>
                </div>
              ))}
            </div>

            {isUploading && (
              <div className="space-y-2">
                <Progress value={uploadProgress} />
                <div className="text-center text-sm text-muted-foreground">
                  Загрузка... {uploadProgress}%
                </div>
              </div>
            )}

            <Button
              onClick={handleUpload}
              disabled={isUploading}
              className="w-full rounded-xl"
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

            <div className="rounded-xl border border-[hsl(var(--status-calm)/0.3)] bg-[hsl(var(--status-calm)/0.08)] p-3 text-sm text-muted-foreground">
              🔒 Все чувствительные данные (токены, пароли, email) автоматически
              удаляются перед отправкой
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
