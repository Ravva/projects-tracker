import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { cn } from "@/lib/utils";

export function MarkdownContent({
  className,
  content,
}: {
  className?: string;
  content: string;
}) {
  return (
    <div className={cn("text-sm leading-7 text-muted-foreground", className)}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ className: headingClassName, ...props }) => (
            <h1
              className={cn(
                "mt-6 mb-3 text-2xl font-semibold tracking-tight text-foreground first:mt-0",
                headingClassName,
              )}
              {...props}
            />
          ),
          h2: ({ className: headingClassName, ...props }) => (
            <h2
              className={cn(
                "mt-6 mb-3 text-xl font-semibold tracking-tight text-foreground first:mt-0",
                headingClassName,
              )}
              {...props}
            />
          ),
          h3: ({ className: headingClassName, ...props }) => (
            <h3
              className={cn(
                "mt-5 mb-2 text-lg font-semibold text-foreground first:mt-0",
                headingClassName,
              )}
              {...props}
            />
          ),
          h4: ({ className: headingClassName, ...props }) => (
            <h4
              className={cn(
                "mt-4 mb-2 text-base font-semibold text-foreground first:mt-0",
                headingClassName,
              )}
              {...props}
            />
          ),
          p: ({ className: paragraphClassName, ...props }) => (
            <p className={cn("my-3", paragraphClassName)} {...props} />
          ),
          ul: ({ className: listClassName, ...props }) => (
            <ul
              className={cn(
                "my-3 list-disc space-y-2 pl-5 marker:text-foreground/60",
                listClassName,
              )}
              {...props}
            />
          ),
          ol: ({ className: listClassName, ...props }) => (
            <ol
              className={cn(
                "my-3 list-decimal space-y-2 pl-5 marker:text-foreground/60",
                listClassName,
              )}
              {...props}
            />
          ),
          li: ({ className: itemClassName, ...props }) => (
            <li className={cn("pl-1", itemClassName)} {...props} />
          ),
          blockquote: ({ className: quoteClassName, ...props }) => (
            <blockquote
              className={cn(
                "my-4 border-l-2 border-border/80 pl-4 italic text-foreground/80",
                quoteClassName,
              )}
              {...props}
            />
          ),
          a: ({ className: anchorClassName, ...props }) => (
            <a
              className={cn(
                "font-medium text-primary underline underline-offset-4",
                anchorClassName,
              )}
              target="_blank"
              rel="noreferrer"
              {...props}
            />
          ),
          code: ({ className: codeClassName, children, ...props }) => {
            const isBlock = Boolean(codeClassName?.includes("language-"));

            if (isBlock) {
              return (
                <code
                  className={cn(
                    "block overflow-x-auto rounded-xl bg-muted px-4 py-3 font-mono text-xs text-foreground",
                    codeClassName,
                  )}
                  {...props}
                >
                  {children}
                </code>
              );
            }

            return (
              <code
                className={cn(
                  "rounded bg-muted px-1.5 py-0.5 font-mono text-xs text-foreground",
                  codeClassName,
                )}
                {...props}
              >
                {children}
              </code>
            );
          },
          pre: ({ className: preClassName, ...props }) => (
            <pre
              className={cn("my-4 overflow-x-auto", preClassName)}
              {...props}
            />
          ),
          hr: ({ className: hrClassName, ...props }) => (
            <hr
              className={cn("my-6 border-border/70", hrClassName)}
              {...props}
            />
          ),
          table: ({ className: tableClassName, ...props }) => (
            <div className="my-4 overflow-x-auto">
              <table
                className={cn(
                  "min-w-full border-collapse text-left",
                  tableClassName,
                )}
                {...props}
              />
            </div>
          ),
          th: ({ className: cellClassName, ...props }) => (
            <th
              className={cn(
                "border-b border-border/70 px-3 py-2 font-semibold text-foreground",
                cellClassName,
              )}
              {...props}
            />
          ),
          td: ({ className: cellClassName, ...props }) => (
            <td
              className={cn(
                "border-b border-border/50 px-3 py-2 align-top",
                cellClassName,
              )}
              {...props}
            />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
