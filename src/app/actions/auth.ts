'use server'

import { createClient } from '@supabase/supabase-js'

// Create a Supabase client with admin privileges
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

export async function registerUser(email: string, password: string, name: string) {
  try {
    // First check if user already exists
    const { data: existingUsers } = await supabaseAdmin
      .from('auth.users')
      .select('id')
      .eq('email', email)
      .limit(1)
    
    if (existingUsers && existingUsers.length > 0) {
      return { success: false, error: "Пользователь с таким email уже существует" }
    }
    
    // Create user with admin privileges
    const { data, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Skip email confirmation
      user_metadata: { name }
    })

    if (error) {
      console.error("Admin API error:", error)
      return { success: false, error: error.message }
    }

    if (data.user) {
      try {
        // Add user to the users table
        const { error: insertError } = await supabaseAdmin
          .from('users')
          .insert({
            id: data.user.id,
            email,
            name,
            created_at: new Date().toISOString()
          })

        if (insertError) {
          console.error("Error inserting user data:", insertError)
          
          // If we can't insert into users table, delete the auth user to maintain consistency
          try {
            await supabaseAdmin.auth.admin.deleteUser(data.user.id)
          } catch (deleteErr) {
            console.error("Failed to delete auth user after profile creation failed:", deleteErr)
          }
          
          return { success: false, error: `Ошибка при создании профиля: ${insertError.message}` }
        }
      } catch (profileErr) {
        console.error("Profile creation error:", profileErr)
        
        // If profile creation fails, delete the auth user
        try {
          await supabaseAdmin.auth.admin.deleteUser(data.user.id)
        } catch (deleteErr) {
          console.error("Failed to delete auth user after profile creation failed:", deleteErr)
        }
        
        return { success: false, error: "Ошибка при создании профиля пользователя" }
      }

      return { success: true, userId: data.user.id }
    }

    return { success: false, error: "Unknown error occurred" }
  } catch (err: any) {
    console.error("Server registration error:", err)
    return { success: false, error: err.message || "Server error" }
  }
}