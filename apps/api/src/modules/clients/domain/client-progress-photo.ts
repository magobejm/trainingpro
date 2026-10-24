export const PROGRESS_POSES = ['front', 'side', 'back'] as const;
export type ProgressPose = (typeof PROGRESS_POSES)[number];
export const PROGRESS_ACTORS = ['coach', 'client'] as const;
export type ProgressActor = (typeof PROGRESS_ACTORS)[number];

export type ProgressPhotoMeta = {
  pose?: ProgressPose | null;
  uploadedBy?: ProgressActor;
};

export type ClientProgressPhoto = {
  archived: boolean;
  clientId: string;
  createdAt: Date;
  id: string;
  imageUrl: string;
  pose: ProgressPose | null;
  updatedAt: Date;
  uploadedBy: ProgressActor;
};
