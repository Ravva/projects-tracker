"use server";

import { createClient } from "@supabase/supabase-js";

// Check if required environment variables are set
if (
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  !process.env.SUPABASE_SERVICE_ROLE_KEY
) {
  console.error(
    "Error: Required Supabase environment variables are missing. Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY in your environment.",
  );
}

// Create a Supabase client with admin privileges only if environment variables are available
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

// Custom fetch function with timeout and better error handling
const customFetch = (...args: Parameters<typeof fetch>) => {
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
        "Supabase admin fetch error:",
        err.message,
        err.cause ? JSON.stringify(err.cause) : "",
        "URL:",
        args[0]?.toString()?.replace(/\?.*$/, "?[params-redacted]"),
      );
      throw err;
    });
};

const supabaseAdmin =
  supabaseUrl && serviceRoleKey
    ? createClient(supabaseUrl, serviceRoleKey, {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
        global: {
          headers: {
            "Content-Type": "application/json",
            "X-Client-Info": "projects-tracker-admin",
          },
          fetch: customFetch,
        },
        db: {
          schema: "public",
        },
      })
    : null;

export async function registerUser(
  email: string,
  password: string,
  name: string,
) {
  try {
    // Check if Supabase client is initialized
    if (!supabaseAdmin) {
      return {
        success: false,
        error:
          "Supabase connection not available. Please check your environment variables.",
      };
    }

    // First check if user already exists
    try {
      // Use a more direct approach to check if user exists
      let retries = 3; // Increased from 2 to 3 retries
      let existingUsers;
      let queryError;

      while (retries >= 0) {
        try {
          const result = await supabaseAdmin.auth.admin.listUsers({
            filter: {
              email: email,
            },
          });

          existingUsers = result.data;
          queryError = result.error;
          break; // Success, exit the retry loop
        } catch (networkErr) {
          if (
            retries > 0 &&
            networkErr instanceof Error &&
            (networkErr.message.includes("fetch failed") ||
              networkErr.message.includes("ENOTFOUND"))
          ) {
            console.log(
              `Network error checking user, retrying... (${retries} attempts left)`,
            );
            retries--;
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            // No more retries or not a network error
            throw networkErr;
          }
        }
      }

      if (queryError) {
        console.error("Error checking existing user:", queryError);
        return {
          success: false,
          error: "Error checking existing user: " + queryError.message,
        };
      }

      if (
        existingUsers &&
        existingUsers.users &&
        existingUsers.users.length > 0
      ) {
        return {
          success: false,
          error: "Пользователь с таким email уже существует",
        };
      }
    } catch (checkErr) {
      console.error("Error checking existing user:", checkErr);
      // Provide more detailed error information
      const errorMessage =
        checkErr instanceof Error
          ? `${checkErr.message}${checkErr.cause ? ` (Cause: ${JSON.stringify(checkErr.cause)})` : ""}`
          : "Unknown error";

      return {
        success: false,
        error: "Error checking existing user: " + errorMessage,
      };
    }

    // Create user with admin privileges
    try {
      // Add retry logic for network issues
      let retries = 3; // Increased from 2 to 3 retries
      let data;
      let error;

      while (retries >= 0) {
        try {
          // First, check if the user already exists in the auth system
          const { data: existingAuthUsers, error: checkError } =
            await supabaseAdmin.auth.admin.listUsers({
              filter: {
                email: email,
              },
            });

          if (checkError) {
            console.error("Error checking existing auth user:", checkError);
            return {
              success: false,
              error: "Error checking user account: " + checkError.message,
            };
          }

          if (existingAuthUsers?.users && existingAuthUsers.users.length > 0) {
            return {
              success: false,
              error: "Пользователь с таким email уже существует",
            };
          }

          // Create the user if they don't exist
          // Add specific retry logic for createUser which can sometimes fail with database errors
          let createRetries = 5; // Increased from 3 to 5 retries
          let result;

          while (createRetries >= 0) {
            try {
              try {
                // We're not adding a separate AbortController here anymore
                // since we already have one in the customFetch function
                result = await supabaseAdmin.auth.admin.createUser({
                  email,
                  password,
                  email_confirm: true, // Skip email confirmation
                  user_metadata: { name },
                });
              } catch (abortErr) {
                throw new Error(
                  abortErr instanceof Error
                    ? `Request error: ${abortErr.message}`
                    : "Error during user creation",
                );
              }

              // If there's a database error or other retriable error, retry
              if (
                result.error &&
                (result.error.message?.includes("Database error") ||
                  result.error.message?.includes("unexpected_failure") ||
                  result.error.message?.includes("timeout") ||
                  result.error.message?.includes("connection") ||
                  result.error.message?.includes("network") ||
                  result.error.status === 500 ||
                  result.error.code === "unexpected_failure")
              ) {
                if (createRetries > 0) {
                  console.log(
                    `Database error creating user, retrying... (${createRetries} attempts left)`,
                    JSON.stringify(result.error),
                  );
                  createRetries--;
                  // Improved exponential backoff with jitter
                  const baseDelay = 3000; // Start with 3s base delay
                  const exponentialPart = Math.pow(2, 3 - createRetries);
                  const jitter = Math.random() * 1000; // Add up to 1s of random jitter
                  const backoffTime = baseDelay * exponentialPart + jitter;

                  console.log(
                    `Waiting ${Math.round(backoffTime / 1000)}s before retry...`,
                  );
                  await new Promise((resolve) =>
                    setTimeout(resolve, backoffTime),
                  );
                  continue;
                }
              }

              break; // Success or non-retriable error, exit retry loop
            } catch (createErr) {
              if (
                createRetries > 0 &&
                createErr instanceof Error &&
                (createErr.message.includes("fetch failed") ||
                  createErr.message.includes("ENOTFOUND") ||
                  createErr.message.includes("timeout") ||
                  createErr.message.includes("abort") ||
                  createErr.message.includes("Database error") ||
                  createErr.message.includes("network") ||
                  createErr.message.includes("connection") ||
                  createErr.name === "AbortError")
              ) {
                console.log(
                  `Error creating user, retrying... (${createRetries} attempts left)`,
                  createErr.message,
                  createErr.name,
                );
                createRetries--;
                // Improved exponential backoff with jitter
                const baseDelay = 3000; // Start with 3s
                const exponentialPart = Math.pow(2, 3 - createRetries);
                const jitter = Math.random() * 1000; // Add up to 1s of random jitter
                const backoffTime = baseDelay * exponentialPart + jitter;

                console.log(
                  `Waiting ${Math.round(backoffTime / 1000)}s before retry...`,
                );
                await new Promise((resolve) =>
                  setTimeout(resolve, backoffTime),
                );
              } else {
                // No more retries or not a retriable error
                result = {
                  data: null,
                  error: {
                    message:
                      createErr instanceof Error
                        ? createErr.message
                        : "Unknown error creating user",
                    status: 500,
                    code: "unexpected_failure",
                  },
                };
                break;
              }
            }
          }

          data = result.data;
          error = result.error;
          break; // Success, exit the retry loop
        } catch (networkErr) {
          if (
            retries > 0 &&
            networkErr instanceof Error &&
            (networkErr.message.includes("fetch failed") ||
              networkErr.message.includes("ENOTFOUND"))
          ) {
            console.log(
              `Network error, retrying... (${retries} attempts left)`,
            );
            retries--;
            // Wait before retrying
            await new Promise((resolve) => setTimeout(resolve, 1000));
          } else {
            // No more retries or not a network error
            throw networkErr;
          }
        }
      }

      if (error) {
        console.error("Admin API error:", error);

        // Provide more specific error messages based on error type
        if (error.message.includes("Database error")) {
          return {
            success: false,
            error:
              "Ошибка базы данных при создании пользователя. Пожалуйста, попробуйте позже или обратитесь в службу поддержки.",
          };
        }

        if (
          error.message.includes("duplicate key") ||
          error.message.includes("already exists")
        ) {
          return {
            success: false,
            error: "Пользователь с таким email уже существует",
          };
        }

        return { success: false, error: error.message };
      }

      if (data.user) {
        try {
          // Add user to the users table with retry logic
          let insertRetries = 3; // Increased from 2 to 3 retries
          let insertError = null;

          while (insertRetries >= 0) {
            try {
              const { error } = await supabaseAdmin.from("users").insert({
                id: data.user.id,
                email,
                name,
                created_at: new Date().toISOString(),
              });

              insertError = error;
              break; // Success or non-network error, exit retry loop
            } catch (dbErr) {
              if (
                insertRetries > 0 &&
                dbErr instanceof Error &&
                (dbErr.message.includes("fetch failed") ||
                  dbErr.message.includes("ENOTFOUND") ||
                  dbErr.message.includes("timeout"))
              ) {
                console.log(
                  `Database insert error, retrying... (${insertRetries} attempts left)`,
                );
                insertRetries--;
                await new Promise((resolve) => setTimeout(resolve, 1000));
              } else {
                // No more retries or not a network error
                insertError = {
                  message:
                    dbErr instanceof Error
                      ? dbErr.message
                      : "Unknown database error",
                };
                break;
              }
            }
          }

          if (insertError) {
            console.error("Error inserting user data:", insertError);

            // If we can't insert into users table, delete the auth user to maintain consistency
            try {
              await supabaseAdmin.auth.admin.deleteUser(data.user.id);
            } catch (deleteErr) {
              console.error(
                "Failed to delete auth user after profile creation failed:",
                deleteErr,
              );
            }

            return {
              success: false,
              error: `Ошибка при создании профиля: ${insertError.message}`,
            };
          }
        } catch (profileErr) {
          console.error("Profile creation error:", profileErr);

          // If profile creation fails, delete the auth user
          try {
            await supabaseAdmin.auth.admin.deleteUser(data.user.id);
          } catch (deleteErr) {
            console.error(
              "Failed to delete auth user after profile creation failed:",
              deleteErr,
            );
          }

          return {
            success: false,
            error: "Ошибка при создании профиля пользователя",
          };
        }

        return { success: true, userId: data.user.id };
      }

      return { success: false, error: "Unknown error occurred" };
    } catch (createErr) {
      console.error("User creation error:", createErr);

      // Provide more detailed error information
      let errorMessage = "Error creating user";

      if (createErr instanceof Error) {
        console.error("Error details:", {
          message: createErr.message,
          name: createErr.name,
          cause: createErr.cause,
          stack: createErr.stack,
        });

        if (createErr.message.includes("Database error")) {
          errorMessage =
            "Ошибка базы данных при создании пользователя. Пожалуйста, попробуйте позже.";
        } else if (
          createErr.message.includes("network") ||
          createErr.message.includes("fetch failed") ||
          createErr.message.includes("ENOTFOUND") ||
          createErr.message.includes("timeout")
        ) {
          errorMessage =
            "Проблема с подключением к серверу. Пожалуйста, проверьте ваше интернет-соединение и попробуйте снова.";
        } else {
          errorMessage = "Error creating user: " + createErr.message;
        }
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  } catch (err: any) {
    console.error("Server registration error:", err);
    return { success: false, error: err.message || "Server error" };
  }
}
