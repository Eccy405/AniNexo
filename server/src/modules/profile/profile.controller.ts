import { Request, Response, NextFunction } from 'express';
import { ProfileService } from './profile.service';
import { UserIntelligenceService } from '../user/userIntelligence.service';

export class ProfileController {
  private profileService: ProfileService;
  private intelService: UserIntelligenceService;

  constructor() {
    this.profileService = new ProfileService();
    this.intelService = new UserIntelligenceService();
  }

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const username = (req.params.username as string)?.trim();
      console.log(`[ProfileController] Petición de perfil para: "${username}"`);

      if (!username) {
        return res.status(400).json({ success: false, message: 'El nombre de usuario es requerido' });
      }

      const profile = await this.profileService.getProfileByUsername(username);
      
      if (!profile) {
        console.warn(`[ProfileController] Perfil no encontrado: "${username}"`);
        return res.status(404).json({ success: false, message: 'Usuario no encontrado' });
      }

      console.log(`[ProfileController] Perfil encontrado: "${profile.username}" (ID: ${profile.id})`);

      res.status(200).json({
        success: true,
        data: profile
      });
    } catch (error) {
      console.error(`[ProfileController] Error al obtener perfil:`, error);
      next(error);
    }
  };

  saveOnboarding = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      const bodySize = JSON.stringify(req.body).length;
      
      console.log(`[ProfileController] Recibiendo onboarding para usuario ID: ${userId}`);
      console.log(`[ProfileController] Tamaño del payload: ${(bodySize / 1024 / 1024).toFixed(2)} MB`);

      if (!userId) {
        console.warn(`[ProfileController] Intento de onboarding sin autorización`);
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      const result = await this.intelService.setupInitialProfile(userId, req.body);
      console.log(`[ProfileController] Onboarding completado con éxito para ${userId}`);

      res.status(200).json({
        success: true,
        message: 'Perfil inteligente configurado correctamente',
        data: result
      });
    } catch (error) {
      next(error);
    }
  };

  updateProfile = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = (req as any).user?.id;
      if (!userId) {
        return res.status(401).json({ success: false, message: 'No autorizado' });
      }

      console.log(`[ProfileController] Petición de actualización para usuario ID: ${userId}`);
      const updatedProfile = await this.profileService.updateProfile(userId, req.body);

      res.status(200).json({
        success: true,
        message: 'Perfil actualizado con éxito',
        data: updatedProfile
      });
    } catch (error) {
      next(error);
    }
  };
}
