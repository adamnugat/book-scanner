-- CreateTable
CREATE TABLE "users" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "subscription_plans" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "plan_type" TEXT NOT NULL DEFAULT 'free',
    "pages_limit" INTEGER NOT NULL DEFAULT 30,
    "projects_limit" INTEGER NOT NULL DEFAULT 1,
    "started_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expires_at" TIMESTAMP(3),

    CONSTRAINT "subscription_plans_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "usage_tracking" (
    "id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "period_month" TEXT NOT NULL,
    "pages_used" INTEGER NOT NULL DEFAULT 0,
    "characters_processed" INTEGER NOT NULL DEFAULT 0,
    "audio_seconds_generated" INTEGER NOT NULL DEFAULT 0,
    "storage_used_bytes" BIGINT NOT NULL DEFAULT 0,

    CONSTRAINT "usage_tracking_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "projects" (
    "id" TEXT NOT NULL,
    "owner_id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "cover_url" TEXT,
    "language" TEXT NOT NULL DEFAULT 'pl',
    "voice_id" TEXT,
    "interstitial_preset" TEXT,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "projects_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "project_shares" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "shared_with_user_id" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'viewer',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "project_shares_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "page_images" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "thumbnail_path" TEXT,
    "order_index" INTEGER NOT NULL,
    "original_filename" TEXT,
    "file_size" INTEGER,
    "mime_type" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "page_images_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "text_regions" (
    "id" TEXT NOT NULL,
    "page_image_id" TEXT NOT NULL,
    "x" DOUBLE PRECISION NOT NULL,
    "y" DOUBLE PRECISION NOT NULL,
    "width" DOUBLE PRECISION NOT NULL,
    "height" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "text_regions_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "scenes" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "page_image_id" TEXT NOT NULL,
    "ocr_text" TEXT,
    "edited_text" TEXT,
    "status" TEXT NOT NULL DEFAULT 'queued',
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "scenes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "voice_profiles" (
    "id" TEXT NOT NULL,
    "elevenlabs_voice_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "language" TEXT NOT NULL,
    "preview_url" TEXT,
    "is_available_free" BOOLEAN NOT NULL DEFAULT false,
    "is_available_premium" BOOLEAN NOT NULL DEFAULT true,
    "is_available_max" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "voice_profiles_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "interstitial_presets" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "audio_url" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,

    CONSTRAINT "interstitial_presets_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "audio_tracks" (
    "id" TEXT NOT NULL,
    "scene_id" TEXT NOT NULL,
    "storage_path" TEXT NOT NULL,
    "duration_ms" INTEGER NOT NULL,
    "file_size" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audio_tracks_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "playlist_items" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "reference_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,

    CONSTRAINT "playlist_items_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "qr_share_links" (
    "id" TEXT NOT NULL,
    "project_id" TEXT NOT NULL,
    "deep_link_url" TEXT NOT NULL,
    "qr_image_url" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "qr_share_links_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "usage_tracking_user_id_period_month_key" ON "usage_tracking"("user_id", "period_month");

-- CreateIndex
CREATE UNIQUE INDEX "project_shares_project_id_shared_with_user_id_key" ON "project_shares"("project_id", "shared_with_user_id");

-- CreateIndex
CREATE UNIQUE INDEX "scenes_page_image_id_key" ON "scenes"("page_image_id");

-- CreateIndex
CREATE UNIQUE INDEX "voice_profiles_elevenlabs_voice_id_key" ON "voice_profiles"("elevenlabs_voice_id");

-- CreateIndex
CREATE UNIQUE INDEX "audio_tracks_scene_id_key" ON "audio_tracks"("scene_id");

-- AddForeignKey
ALTER TABLE "subscription_plans" ADD CONSTRAINT "subscription_plans_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "usage_tracking" ADD CONSTRAINT "usage_tracking_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "projects" ADD CONSTRAINT "projects_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_shares" ADD CONSTRAINT "project_shares_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "project_shares" ADD CONSTRAINT "project_shares_shared_with_user_id_fkey" FOREIGN KEY ("shared_with_user_id") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "page_images" ADD CONSTRAINT "page_images_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "text_regions" ADD CONSTRAINT "text_regions_page_image_id_fkey" FOREIGN KEY ("page_image_id") REFERENCES "page_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "scenes" ADD CONSTRAINT "scenes_page_image_id_fkey" FOREIGN KEY ("page_image_id") REFERENCES "page_images"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "audio_tracks" ADD CONSTRAINT "audio_tracks_scene_id_fkey" FOREIGN KEY ("scene_id") REFERENCES "scenes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "playlist_items" ADD CONSTRAINT "playlist_items_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "qr_share_links" ADD CONSTRAINT "qr_share_links_project_id_fkey" FOREIGN KEY ("project_id") REFERENCES "projects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
