import Resume from '../models/resumeModel.js'
import fs from 'fs'
import path from 'path'


export const createResume = async (req, res) => {
    try {
        const { title } = req.body;

        // Default template
        const defaultResumeData = {
            profileInfo: {
                profileImg: null,
                previewUrl: '',
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
                    progress: '',
                },
            ],
            interests: [''],
        };

        const newResume = await Resume.create({
            userId: req.user._id,
            title,
            ...defaultResumeData,
            ...req.body,
        })

        res.status(201).json(newResume)


    } catch (error) {
        res.status(500).json({ msg: "failed to create resume", error: error.msg })
    }
}


// Get Function
export const getUserResumes = async (req, res) => {
    try {
        const resumes = await Resume.find({ userId: req.user._id }).sort({
            updateAt: -1
        });
        res.json(resumes)

    } catch (error) {
        res.status(500).json({ msg: "failed to get resumes", error: error.msg })
        
    }
}


// Get Resume By ID
export const getResumeById = async (req, res) => {
    try {
        const resume = await Resume.findOne({ _id: req.params.id, userId: req.user._id })
        if (!resume) {
            return res.status(404).json({msg:"Resume not found"})
        }
        res.json(resume)
    } catch (error) {
        res.status(500).json({ msg: "failed to get resumes", error: error.msg })
    }
}


// update resumes

export const updateResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
           userId:req.user._id 
        })
        if (!resume) {
            return res.status(404).json({msg:"Resume not found or not authorized"})
        }

        // MERGE UPDATED RESUMES
        Object.assign(resume, req.body)
        // Save updated resume
        const savedRsume = await resume.save();
        res.json(savedRsume)

    } catch (error) {
        res.status(500).json({ msg: "failed to update resume", error: error.msg }) 
    }
}



// delete resume
export const deleteResume = async (req, res) => {
    try {
        const resume = await Resume.findOne({
            _id: req.params.id,
           userId:req.user._id 
        })
        if (!resume) {
            return res.status(404).json({msg:"Resume not found or not authorized"})
        }

        // create a uploads folder and store the resume there 
        const uploadsFolder = path.join(process.cwd(), 'uploads')

        // delete thumbnail function
        if (resume.thumbnailLink) {
            const oldThumbnail = path.join(uploadsFolder, path.basename(resume.thumbnailLink))
            if (fs.existsSync(oldThumbnail)) {
                fs.unlinkSync(oldThumbnail)
            }
        }

        if (resume.profileInfo?.profilePreviewUrl) {
            const oldProfile = path.join(
                uploadsFolder,
                path.basename(resume.profileInfo.profilePreviewUrl)
            )
            if (fs.existsSync(oldprofile)) {
                fs.unlinkSync(oldProfile)
            }


            // delete resume doc
            const deleted = await Resume.findOneAndDelete({
                _id: req.params.id,
                userId:req.user._id 
            })
            if (!deleted) {
                return res.status(404).json({msg:"Resume not found or not authorized"})
            }
            res.json({msg:"Resume Deleted successfully"})
        }
    } catch (error) {
        res.status(500).json({msg:"Failed to delete resume", error:error.msg})
    }
}