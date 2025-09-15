import { supabase } from './supabase'
import type { Family, FamilyMember, ApiResponse } from '@/types'

export class FamilyService {
  // Create a new family
  async createFamily(userId: string, familyName: string): Promise<ApiResponse<Family>> {
    try {
      console.log('Creating family with userId:', userId, 'familyName:', familyName)
      
      // First ensure user profile exists
      const { data: userProfile, error: userCheckError } = await supabase
        .from('users')
        .select('id, email, full_name')
        .eq('id', userId)
        .single()

      if (userCheckError || !userProfile) {
        console.error('User profile not found:', userCheckError)
        return {
          data: null,
          error: 'User profile tidak ditemukan. Silakan logout dan login kembali.',
          status: 400
        }
      }

      console.log('User profile found:', userProfile)

      // Create family
      const { data: family, error: familyError } = await supabase
        .from('families')
        .insert({
          name: familyName,
          created_by: userId
        })
        .select()
        .single()

      if (familyError) {
        console.error('Family creation error:', familyError)
        return {
          data: null,
          error: `Gagal membuat keluarga: ${familyError.message}`,
          status: 400
        }
      }

      console.log('Family created:', family)

      // Add creator as owner to family_members
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          user_id: userId,
          family_id: family.id,
          role: 'owner'
        })

      if (memberError) {
        // Clean up family if member creation fails
        await supabase.from('families').delete().eq('id', family.id)
        return {
          data: null,
          error: memberError.message,
          status: 400
        }
      }

      // Create default categories
      await supabase.rpc('create_default_categories', {
        family_id_param: family.id,
        user_id_param: userId
      })

      return {
        data: family,
        error: null,
        status: 201
      }
    } catch (error) {
      console.error('Error creating family:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat membuat keluarga',
        status: 500
      }
    }
  }

  // Join existing family by code
  async joinFamily(userId: string, familyCode: string): Promise<ApiResponse<Family>> {
    try {
      // Find family by code
      const { data: family, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('family_code', familyCode.toUpperCase())
        .single()

      if (familyError || !family) {
        return {
          data: null,
          error: 'Kode keluarga tidak ditemukan',
          status: 404
        }
      }

      // Check if user is already a member
      const { data: existingMember } = await supabase
        .from('family_members')
        .select('id')
        .eq('user_id', userId)
        .eq('family_id', family.id)
        .single()

      if (existingMember) {
        return {
          data: null,
          error: 'Anda sudah menjadi anggota keluarga ini',
          status: 400
        }
      }

      // Add user as member
      const { error: memberError } = await supabase
        .from('family_members')
        .insert({
          user_id: userId,
          family_id: family.id,
          role: 'member'
        })

      if (memberError) {
        return {
          data: null,
          error: memberError.message,
          status: 400
        }
      }

      return {
        data: family,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error joining family:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat bergabung dengan keluarga',
        status: 500
      }
    }
  }

  // Get family details
  async getFamily(familyId: string): Promise<ApiResponse<Family>> {
    try {
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyId)
        .single()

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error getting family:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengambil data keluarga',
        status: 500
      }
    }
  }

  // Get family members
  async getFamilyMembers(familyId: string): Promise<ApiResponse<FamilyMember[]>> {
    try {
      const { data, error } = await supabase
        .from('family_members')
        .select(`
          *,
          user:users(id, full_name, email)
        `)
        .eq('family_id', familyId)
        .order('joined_at')

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data: data || [],
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error getting family members:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengambil anggota keluarga',
        status: 500
      }
    }
  }

  // Update family name
  async updateFamily(familyId: string, updates: Partial<Family>): Promise<ApiResponse<Family>> {
    try {
      const { data, error } = await supabase
        .from('families')
        .update(updates)
        .eq('id', familyId)
        .select()
        .single()

      if (error) {
        return {
          data: null,
          error: error.message,
          status: 400
        }
      }

      return {
        data,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error updating family:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengupdate keluarga',
        status: 500
      }
    }
  }

  // Remove member from family
  async removeMember(familyId: string, userId: string): Promise<ApiResponse<null>> {
    try {
      const { error } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId)
        .eq('user_id', userId)

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
      console.error('Error removing member:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat mengeluarkan anggota',
        status: 500
      }
    }
  }

  // Leave family
  async leaveFamily(familyId: string, userId: string): Promise<ApiResponse<null>> {
    try {
      // Check if user is the owner
      const { data: member } = await supabase
        .from('family_members')
        .select('role')
        .eq('family_id', familyId)
        .eq('user_id', userId)
        .single()

      if (member?.role === 'owner') {
        // Check if there are other members
        const { data: members, error: membersError } = await supabase
          .from('family_members')
          .select('id')
          .eq('family_id', familyId)

        if (membersError) {
          return {
            data: null,
            error: membersError.message,
            status: 400
          }
        }

        if (members && members.length > 1) {
          return {
            data: null,
            error: 'Sebagai pemilik, Anda harus mentransfer kepemilikan atau mengeluarkan semua anggota sebelum keluar',
            status: 400
          }
        }

        // If owner is the only member, delete the family
        await supabase.from('families').delete().eq('id', familyId)
      } else {
        // Just remove the member
        await this.removeMember(familyId, userId)
      }

      return {
        data: null,
        error: null,
        status: 200
      }
    } catch (error) {
      console.error('Error leaving family:', error)
      return {
        data: null,
        error: 'Terjadi kesalahan saat keluar dari keluarga',
        status: 500
      }
    }
  }
}

export const familyService = new FamilyService()