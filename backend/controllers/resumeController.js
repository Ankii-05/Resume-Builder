import fs from 'fs';
import path from 'path';
import mongoose from 'mongoose';
import Resume from '../models/Resume.js';
import PdfDownloadLog from '../models/PdfDownloadLog.js';

function jsonError(res, status, message, err) {
    const body = { message };
    if (process.env.NODE_ENV !== 'production' && err?.message) {
        body.error = err.message;
    }
    return res.status(status).json(body);
}

export const createResume = async (req, res) => {
    try {
        const title =
            typeof req.body.title === 'string' ? req.body.title.trim() : '';
        if (!title) {
            return res.status(400).json({ message: 'Title is required' });
        }

        // Default template (field names must match models/Resume.js)
        const defaultResumeData = {
            profileInfo: {
                profilePreviewUrl: '',
                fullName: '',
                designation: '',
                summary: '',
            },
            contactInfo: {
                email: '',
                phone: '',
                location: '',
                linkedin: '',
                github: '',
                website: '',
            },
            workExperience: [
                {
                    company: '',
                    role: '',
                    startDate: '',
                    endDate: '',
                    description: '',
                },
            ],
            education: [
                {
                    degree: '',
                    institution: '',
                    startDate: '',
                    endDate: '',
                },
            ],
            skills: [
                {
                    name: '',
                    progress: 0,
                },
            ],
            projects: [
                {
                    title: '',
                    description: '',
                    github: '',
                    liveDemo: '',
                },
            ],
            certifications: [
                {
                    title: '',
                    issuer: '',
                    year: '',
                },
            ],
            languages: [
                {
                    name: '',
                    progress: 0,
                },
            ],
            interests: [''],
        };

        const newResume = await Resume.create({
            userId: req.user._id,
            title,
            ...defaultResumeData,
        });

        res.status(201).json(newResume);
    } catch (error) {
        jsonError(res, 500, 'Failed to create resume', error);
    }
};

export const getUserResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user._id }).sort({
            updatedAt: -1,
        });
        res.json(resumes);
    } catch (error) {
        jsonError(res, 500, 'Failed to get resumes', error);
    }
};

export const getResumeById = async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id });

        if (!resume) {
            return res.status(404).json({ message: 'Resume not found' });
        }
        res.json(resume);
    } catch (error) {
        jsonError(res, 500, 'Failed to get resume', error);
    }
};

export const updateResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });
        if (!resume) {
            return res.status(404).json({ message: 'Resume not found or unauthorized' });
        }

        const { userId: _uid, _id: _rid, ...safeBody } = req.body || {};
        Object.assign(resume, safeBody);

        // Save updated resume
        const savedResume = await resume.save();
        res.json(savedResume);
    } catch (error) {
        jsonError(res, 500, 'Failed to update resume', error);
    }
};

export const deleteResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!resume) {
            return res.status(404).json({ message: 'Resume not found or unauthorized' });
        }

        // Folder where uploads are stored
        const uploadsFolder = path.join(process.cwd(), 'uploads');

        // Delete thumbnail image
        if (resume.thumbnailLink) {
            const oldThumbnail = path.join(uploadsFolder, path.basename(resume.thumbnailLink));
            if (fs.existsSync(oldThumbnail)) {
                fs.unlinkSync(oldThumbnail);
            }
        }

        // Delete profile preview image
        if (resume.profileInfo?.profilePreviewUrl) {
            const oldProfile = path.join(
                uploadsFolder,
                path.basename(resume.profileInfo.profilePreviewUrl)
            );
            if (fs.existsSync(oldProfile)) {
                fs.unlinkSync(oldProfile);
            }
        }

        // Delete the resume document
        const deleted = await Resume.findOneAndDelete({
            _id: req.params.id,
            userId: req.user._id,
        });

        if (!deleted) {
            return res.status(404).json({ message: 'Resume not found or unauthorized' });
        }

        res.json({ message: 'Resume deleted successfully' });
    } catch (error) {
        jsonError(res, 500, 'Failed to delete resume', error);
    }
};

/** Public: increment PDF download counter (fire-and-forget from client). */
export const patchDownloadResume = async (req, res) => {
    try {
        const { id } = req.params;
        if (!mongoose.isValidObjectId(id)) {
            return res.status(400).json({ message: 'Invalid resume id' });
        }
        await Resume.findByIdAndUpdate(id, { $inc: { downloadCount: 1 } });
        PdfDownloadLog.create({ resumeId: id }).catch(() => {});
        return res.json({ success: true });
    } catch (error) {
        jsonError(res, 500, 'Failed to update download count', error);
    }
};
