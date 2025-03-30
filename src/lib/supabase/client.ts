import { createClient } from "@supabase/supabase-js";

// Check if environment variables are set
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
) {
  console.warn(
    "Warning: Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY in your environment.",
  );
}

// Log the URL being used (without the key for security)
if (process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.log(`Using Supabase URL: ${process.env.NEXT_PUBLIC_SUPABASE_URL}`);
} else {
  console.error("No Supabase URL provided in environment variables");
}

// Use environment variables
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";

// Only create client if URL and key are available
export const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
        },
        // Add global error handler for network issues
        global: {
          fetch: (...args) => {
            // Create a controller to set timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 20000); // 20 second timeout (increased from 15)

            // Add the signal to the fetch options
            if (typeof args[1] === "object") {
              args[1] = { ...args[1], signal: controller.signal };
            } else {
              args[1] = { signal: controller.signal };
            }

            return fetch(...args)
              .then((response) => {
                clearTimeout(timeoutId);
                return response;
              })
              .catch((err) => {
                clearTimeout(timeoutId);
                console.error(
                  "Supabase fetch error:",
                  err.message,
                  err.name,
                  err.cause ? JSON.stringify(err.cause) : "",
                );
                // Log the URL being used (without sensitive parts)
                const url = args[0]?.toString() || "";
                const sanitizedUrl = url.replace(/\?.*$/, "?[params-redacted]");
                console.error(`Failed request URL: ${sanitizedUrl}`);
                throw err;
              });
          },
          headers: {
            "X-Client-Info": "projects-tracker",
          },
        },
        // Add reasonable timeouts
        realtime: {
          timeout: 10000, // 10 seconds
        },
        db: {
          schema: "public",
        },
      })
    : null;
