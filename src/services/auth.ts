import { supabase } from './supabase'
import type { LoginCredentials, RegisterCredentials, AuthUser, ApiResponse } from '@/types'

export class AuthService {
  // Register new user
  async register(credentials: RegisterCredentials): Promise<ApiResponse<AuthUser>> {
    try {
      // Register with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: credentials.email,
        password: credentials.password,
        options: {
          data: {
            full_name: credentials.full_name
          },
          emailRedirectTo: `${window.location.origin}/auth/confirm`
        }
      })

      if (authError) {
        return {
          data: null,
          error: authError.message,
          status: 400
        }
      }

      // Jangan buat profile user di sini! Tunggu user konfirmasi email dan login.
      return {
        data: null,
        error: null,
        status: 201
      }
    } catch (error) {
      console.error('Registration error:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mendaftar',
        status: 500
      }
    }
  }

  // Login user
  async login(credentials: LoginCredentials): Promise<ApiResponse<AuthUser>> {
    try {
      const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      })

      if (authError) {
        return {
          data: null,
          error: authError.message,
          status: 400
        }
      }

      if (!authData.user) {
        return {
          data: null,
          error: 'Gagal masuk ke akun',
          status: 400
        }
      }

      // Get user profile and family info
      const userProfile = await this.getUserProfile(authData.user.id)
      
      return {
        data: userProfile,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Login error:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat masuk',
        status: 500
      }
    }
  }

  // Logout user
  async logout(): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.signOut()
      
      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data: null,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Logout error:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat keluar',
        status: 500
      }
    }
  }

  // Get current user profile
  async getUserProfile(userId: string): Promise<AuthUser> {
    try {
      // Ensure user profile exists first
      await this.ensureUserProfile(userId)
      
      // Get user data
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single()

      if (userError) {
        throw new Error('Failed to get user profile: ' + userError.message)
      }

      // Get family membership (may not exist for new users)
      const { data: membershipData, error: membershipError } = await supabase
        .from('family_members')
        .select(`
          role,
          family:families(id, name, family_code)
        `)
        .eq('user_id', userId)
        .maybeSingle() // Use maybeSingle() instead of single() to handle no results

      // Don't throw error if no family membership found - that's normal for new users
      if (membershipError && membershipError.code !== 'PGRST116') {
        console.error('Error getting family membership:', membershipError)
      }

      return {
        id: userData.id,
        email: userData.email,
        full_name: userData.full_name,
        family_id: (membershipData?.family as any)?.id || null,
        role: membershipData?.role || null
      }
    } catch (error) {
      console.error('Error getting user profile:', error)
      throw error
    }
  }

  // Get current session
  async getCurrentUser(): Promise<AuthUser | null> {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session?.user) {
        return null
      }

      return await this.getUserProfile(session.user.id)
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // Reset password
  async resetPassword(email: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`
      })

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data: null,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Reset password error:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat reset password',
        status: 500
      }
    }
  }

  // Update user profile
  async updateProfile(userId: string, updates: Partial<{ full_name: string }>): Promise<ApiResponse<AuthUser>> {
    try {
      const { error } = await supabase
        .from('users')
        .update(updates)
        .eq('id', userId)

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      const updatedUser = await this.getUserProfile(userId)
      
      return {
        data: updatedUser,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Update profile error:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat update profil',
        status: 500
      }
    }
  }

  // Ensure user profile exists in public.users table
  async ensureUserProfile(userId: string): Promise<void> {
    try {
      // Check if user profile exists
      const { data: existingUser } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single()

      if (existingUser) {
        return // User profile already exists
      }

      // Get auth user data
      const { data: authUser } = await supabase.auth.getUser()
      
      if (!authUser.user || authUser.user.id !== userId) {
        throw new Error('Invalid auth user')
      }

      // Create user profile
      const { error: insertError } = await supabase
        .from('users')
        .insert({
          id: userId,
          email: authUser.user.email || '',
          full_name: authUser.user.user_metadata?.full_name || 'User'
        })

      if (insertError) {
        throw new Error('Failed to create user profile: ' + insertError.message)
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error)
      throw error
    }
  }

  // Check if user has family
  async checkUserFamily(userId: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', userId)
        .single()

      return !error && !!data
    } catch (error) {
      return false
    }
  }
}

export const authService = new AuthService()