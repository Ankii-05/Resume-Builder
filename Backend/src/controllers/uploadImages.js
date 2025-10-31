import fs from 'fs';
import path from 'path';
import Resume from '../models/resumeModel.js';
import upload from '../middleware/uploadMiddleware.js';

export const uploadResumeImages = async (req, res) => {
    try {
        // Configure multer to handle multiple fields
        upload.fields([{ name: "thumbnail" }, { name: "profileImage" }])(req, res, async (err) => {
            if (err) {
                return res.status(400).json({ msg: "File upload failed", error: err.message });
            }

            const resumeId = req.params.id;
            const resume = await Resume.findOne({ _id: resumeId, userId: req.user._id });

            if (!resume) {
                return res.status(404).json({ msg: "Resume not found or unauthorized" });
            }

            const uploadsFolder = path.join(process.cwd(), "uploads");
            const baseUrl = `${req.protocol}://${req.get("host")}`;

            //  Correct field name access
            const newThumbnail = req.files?.thumbnail?.[0];
            const newProfileImage = req.files?.profileImage?.[0]; // FIXED: was `newProfileImage.[0]` (syntax error)

            //  Handle new thumbnail upload
            if (newThumbnail) {
                if (resume.thumbnailLink) {
                    const oldThumbnail = path.join(uploadsFolder, path.basename(resume.thumbnailLink));
                    if (fs.existsSync(oldThumbnail)) {
                        fs.unlinkSync(oldThumbnail);
                    }
                }
                resume.thumbnailLink = `${baseUrl}/uploads/${newThumbnail.filename}`;
            }

            // Handle new profile image upload
            if (newProfileImage) {
                if (resume.profileInfo?.profilePreviewUrl) {
                    const oldProfile = path.join(uploadsFolder, path.basename(resume.profileInfo.profilePreviewUrl));
                    if (fs.existsSync(oldProfile)) {
                        fs.unlinkSync(oldProfile);
                    }
                }

                // Ensure nested object exists
                if (!resume.profileInfo) {
                    resume.profileInfo = {};
                }

                resume.profileInfo.profilePreviewUrl = `${baseUrl}/uploads/${newProfileImage.filename}`;
            }

            // Save and respond
            await resume.save();

            return res.status(200).json({
                msg: "Images uploaded successfully",
                thumbnailLink: resume.thumbnailLink,
                profilePreviewUrl: resume.profileInfo?.profilePreviewUrl,
            });
        });
    } catch (err) {
        console.error('Error uploading images:', err);
        res.status(500).json({ msg: "Failed to upload images", error: err.message });
    }
};
