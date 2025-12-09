const UserProfile = require('../models/UserProfile');
const User = require('../models/User');

// @desc    Get user profile
// @route   GET /api/profile
// @access  Private
const getUserProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          profile: null,
          needsProfile: true,
          message: 'Profile not created yet'
        }
      });
    }

    // Calculate completion percentage
    profile.calculateCompletionPercentage();
    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        profile,
        needsProfile: false,
        completionPercentage: profile.currentStatus.profileCompletionPercentage
      }
    });

  } catch (error) {
    console.error('Error fetching user profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch user profile',
      error: error.message
    });
  }
};

// @desc    Create or update user profile
// @route   POST /api/profile
// @access  Private
const createOrUpdateProfile = async (req, res) => {
  try {
    const userId = req.user.id;
    const profileData = req.body;

    console.log(`🏗️ Creating/updating profile for user: ${userId}`);

    // Validate required fields
    if (!profileData.basicInfo?.fullName) {
      return res.status(400).json({
        success: false,
        message: 'Full name is required'
      });
    }

    let profile = await UserProfile.findOne({ userId });

    if (profile) {
      // Update existing profile, robustly merge nested objects and arrays
      Object.keys(profileData).forEach(key => {
        if (profileData[key] !== undefined) {
          if (typeof profileData[key] === 'object' && !Array.isArray(profileData[key])) {
            // Merge nested objects
            profile[key] = { ...profile[key], ...profileData[key] };
          } else if (Array.isArray(profileData[key])) {
            // Replace arrays if provided
            profile[key] = profileData[key];
          } else {
            profile[key] = profileData[key];
          }
        }
      });
      profile.currentStatus.lastUpdated = new Date();
    } else {
      // Create new profile
      profile = new UserProfile({
        userId,
        ...profileData,
        currentStatus: {
          lastUpdated: new Date(),
          onboardingStep: 1
        }
      });
    }

    // Calculate completion percentage
    profile.calculateCompletionPercentage();

    await profile.save();

    console.log(`✅ Profile saved with ${profile.currentStatus.profileCompletionPercentage}% completion`);

    res.status(200).json({
      success: true,
      data: {
        profile,
        completionPercentage: profile.currentStatus.profileCompletionPercentage,
        message: profile.currentStatus.isProfileComplete ? 'Profile completed!' : 'Profile updated successfully'
      }
    });

  } catch (error) {
    console.error('Error creating/updating profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to save profile',
      error: error.message
    });
  }
};

// @desc    Update profile step (for onboarding)
// @route   PATCH /api/profile/step
// @access  Private
const updateProfileStep = async (req, res) => {
  try {
    const { step, data } = req.body;
    const userId = req.user.id;

    let profile = await UserProfile.findOne({ userId });
    
    if (!profile) {
      profile = new UserProfile({ userId });
    }

    // Update specific step data
    switch (step) {
      case 1: // Basic Info
        profile.basicInfo = { ...profile.basicInfo, ...data };
        break;
      case 2: // Education
        profile.education = { ...profile.education, ...data };
        break;
      case 3: // Experience
        profile.experience = { ...profile.experience, ...data };
        break;
      case 4: // Technical Skills
        profile.technicalSkills = { ...profile.technicalSkills, ...data };
        break;
      case 5: // Learning Preferences
        profile.learningPreferences = { ...profile.learningPreferences, ...data };
        break;
      case 6: // Career Goals
        profile.careerGoals = { ...profile.careerGoals, ...data };
        break;
      case 7: // Interests
        profile.interests = { ...profile.interests, ...data };
        break;
    }

    profile.currentStatus.onboardingStep = Math.max(profile.currentStatus.onboardingStep, step);
    profile.currentStatus.lastUpdated = new Date();
    profile.calculateCompletionPercentage();

    await profile.save();

    res.status(200).json({
      success: true,
      data: {
        profile,
        currentStep: profile.currentStatus.onboardingStep,
        completionPercentage: profile.currentStatus.profileCompletionPercentage
      }
    });

  } catch (error) {
    console.error('Error updating profile step:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update profile step',
      error: error.message
    });
  }
};

// @desc    Get profile completion status
// @route   GET /api/profile/status
// @access  Private
const getProfileStatus = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(200).json({
        success: true,
        data: {
          needsProfile: true,
          completionPercentage: 0,
          currentStep: 1,
          isComplete: false
        }
      });
    }

    profile.calculateCompletionPercentage();

    res.status(200).json({
      success: true,
      data: {
        needsProfile: false,
        completionPercentage: profile.currentStatus.profileCompletionPercentage,
        currentStep: profile.currentStatus.onboardingStep,
        isComplete: profile.currentStatus.isProfileComplete,
        lastUpdated: profile.currentStatus.lastUpdated
      }
    });

  } catch (error) {
    console.error('Error fetching profile status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch profile status',
      error: error.message
    });
  }
};

// @desc    Get LLM-formatted profile data
// @route   GET /api/profile/llm-format
// @access  Private
const getLLMFormattedProfile = async (req, res) => {
  try {
    const profile = await UserProfile.findOne({ userId: req.user.id });
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        message: 'Profile not found'
      });
    }

    const llmProfile = profile.getLLMProfile();

    res.status(200).json({
      success: true,
      data: {
        llmProfile,
        completionPercentage: profile.currentStatus.profileCompletionPercentage
      }
    });

  } catch (error) {
    console.error('Error getting LLM formatted profile:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get LLM formatted profile',
      error: error.message
    });
  }
};

module.exports = {
  getUserProfile,
  createOrUpdateProfile,
  updateProfileStep,
  getProfileStatus,
  getLLMFormattedProfile
};