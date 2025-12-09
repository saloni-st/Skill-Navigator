/**
 * ResourceMappingService - Maps generic skill names to actual learning resources
 * Provides real URLs, YouTube playlists, documentation, and educational content
 */

class ResourceMappingService {
  static skillResourceMap = {
    // Foundation Skills
    'Foundation Skills (One at a Time)': {
      websites: [
        {
          title: 'MDN Web Docs - HTML Basics',
          url: 'https://developer.mozilla.org/en-US/docs/Learn/HTML/Introduction_to_HTML',
          description: 'Comprehensive HTML documentation and tutorials'
        },
        {
          title: 'CSS-Tricks - CSS Fundamentals',
          url: 'https://css-tricks.com/guides/',
          description: 'Complete guides for CSS fundamentals'
        }
      ],
      videos: [
        {
          title: 'HTML Crash Course For Absolute Beginners',
          url: 'https://www.youtube.com/watch?v=UB1O30fR-EE',
          channel: 'Traversy Media',
          duration: '1 hour'
        },
        {
          title: 'CSS Tutorial - Zero to Hero',
          url: 'https://www.youtube.com/watch?v=1Rs2ND1ryYc',
          channel: 'freeCodeCamp',
          duration: '6 hours'
        }
      ],
      courses: [
        {
          title: 'The Complete Web Developer Course 2024',
          platform: 'Udemy',
          url: 'https://www.udemy.com/course/the-complete-web-developer-course-2/',
          price: 'Paid'
        },
        {
          title: 'Responsive Web Design Certification',
          platform: 'freeCodeCamp',
          url: 'https://www.freecodecamp.org/learn/responsive-web-design/',
          price: 'Free'
        }
      ]
    },

    'Bite-sized Learning': {
      websites: [
        {
          title: 'Codecademy - Interactive Lessons',
          url: 'https://www.codecademy.com/learn/introduction-to-javascript',
          description: 'Interactive coding lessons in small chunks'
        },
        {
          title: 'SoloLearn - Mobile Learning',
          url: 'https://www.sololearn.com/',
          description: 'Learn coding on-the-go with bite-sized lessons'
        }
      ],
      videos: [
        {
          title: 'JavaScript in 100 Seconds',
          url: 'https://www.youtube.com/watch?v=DHjqpvDnNGE',
          channel: 'Fireship',
          duration: '2 minutes'
        },
        {
          title: 'Learn JavaScript - Full Course for Beginners',
          url: 'https://www.youtube.com/watch?v=PkZNo7MFNFg',
          channel: 'freeCodeCamp',
          duration: '3.5 hours'
        }
      ],
      apps: [
        {
          title: 'Grasshopper',
          platform: 'Mobile App',
          url: 'https://grasshopper.app/',
          description: 'Learn JavaScript through fun coding puzzles'
        }
      ]
    },

    'Flexible Scheduling': {
      websites: [
        {
          title: 'The Odin Project',
          url: 'https://www.theodinproject.com/',
          description: 'Self-paced full-stack web development curriculum'
        },
        {
          title: 'Khan Academy - Intro to Programming',
          url: 'https://www.khanacademy.org/computing/intro-to-programming',
          description: 'Learn at your own pace with interactive exercises'
        }
      ],
      videos: [
        {
          title: 'Programming Fundamentals Playlist',
          url: 'https://www.youtube.com/playlist?list=PLWKjhJtqVAbmGw5fN5BQlwuug-8bDmabi',
          channel: 'freeCodeCamp',
          description: 'Comprehensive programming basics playlist'
        }
      ],
      courses: [
        {
          title: 'CS50: Introduction to Computer Science',
          platform: 'edX',
          url: 'https://www.edx.org/course/introduction-computer-science-harvardx-cs50x',
          price: 'Free'
        }
      ]
    },

    // Advanced Skills
    'HTML/CSS': {
      websites: [
        {
          title: 'MDN HTML Reference',
          url: 'https://developer.mozilla.org/en-US/docs/Web/HTML',
          description: 'Complete HTML documentation'
        },
        {
          title: 'CSS Grid Guide',
          url: 'https://css-tricks.com/snippets/css/complete-guide-grid/',
          description: 'Complete guide to CSS Grid'
        }
      ],
      videos: [
        {
          title: 'HTML & CSS Full Course - Beginner to Pro',
          url: 'https://www.youtube.com/watch?v=cyuzt1Dp8X8',
          channel: 'SuperSimpleDev',
          duration: '21 hours'
        }
      ]
    },

    'JavaScript Basics': {
      websites: [
        {
          title: 'JavaScript.info',
          url: 'https://javascript.info/',
          description: 'Modern JavaScript tutorial from basics to advanced'
        },
        {
          title: 'MDN JavaScript Guide',
          url: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide',
          description: 'Comprehensive JavaScript documentation'
        }
      ],
      videos: [
        {
          title: 'JavaScript Tutorial for Beginners',
          url: 'https://www.youtube.com/watch?v=W6NZfCO5SIk',
          channel: 'Programming with Mosh',
          duration: '1 hour'
        }
      ]
    },

    'React': {
      websites: [
        {
          title: 'React Official Documentation',
          url: 'https://react.dev/',
          description: 'Official React documentation and tutorial'
        },
        {
          title: 'React Tutorial for Beginners',
          url: 'https://scrimba.com/learn/learnreact',
          description: 'Interactive React course'
        }
      ],
      videos: [
        {
          title: 'React Course - Beginner\'s Tutorial for React JavaScript Library',
          url: 'https://www.youtube.com/watch?v=bMknfKXIFA8',
          channel: 'freeCodeCamp',
          duration: '12 hours'
        }
      ]
    },

    'Node.js': {
      websites: [
        {
          title: 'Node.js Official Documentation',
          url: 'https://nodejs.org/en/docs/',
          description: 'Official Node.js documentation'
        },
        {
          title: 'Node.js Tutorial',
          url: 'https://www.w3schools.com/nodejs/',
          description: 'W3Schools Node.js tutorial'
        }
      ],
      videos: [
        {
          title: 'Node.js Tutorial for Beginners',
          url: 'https://www.youtube.com/watch?v=TlB_eWDSMt4',
          channel: 'Programming with Mosh',
          duration: '1 hour'
        }
      ]
    }
  };

  static projectResourceMap = {
    'Personal Portfolio Website': {
      tutorials: [
        {
          title: 'Build a Portfolio Website Tutorial',
          url: 'https://www.youtube.com/watch?v=xV7S8BhIeBo',
          channel: 'freeCodeCamp',
          description: 'Complete portfolio website tutorial'
        }
      ],
      templates: [
        {
          title: 'Portfolio Website Templates',
          url: 'https://github.com/topics/portfolio-website',
          description: 'GitHub repository templates'
        }
      ]
    },

    'Weekend Project Ideas': {
      websites: [
        {
          title: '40 JavaScript Projects for Beginners',
          url: 'https://javascript.plainenglish.io/40-javascript-projects-for-beginners-3fb2c9c8c2b8',
          description: 'Comprehensive list of beginner projects'
        },
        {
          title: 'Project Based Learning',
          url: 'https://github.com/practical-tutorials/project-based-learning',
          description: 'Curated list of project-based tutorials'
        }
      ],
      projects: [
        'Calculator App',
        'Todo List',
        'Weather App',
        'Quiz Game',
        'Random Quote Generator'
      ]
    },

    'To-Do List Application': {
      tutorials: [
        {
          title: 'Build a Todo App with JavaScript',
          url: 'https://www.youtube.com/watch?v=Ttf3CEsEwMQ',
          channel: 'Web Dev Simplified',
          description: 'Complete todo app tutorial'
        }
      ]
    }
  };

  static learningResourceMap = {
    'Flexible Online Courses': {
      platforms: [
        {
          title: 'Coursera - Computer Science',
          url: 'https://www.coursera.org/browse/computer-science',
          description: 'University-level courses with flexible scheduling'
        },
        {
          title: 'edX - Computer Science',
          url: 'https://www.edx.org/learn/computer-science',
          description: 'Free courses from top universities'
        },
        {
          title: 'Udemy - Web Development',
          url: 'https://www.udemy.com/topic/web-development/',
          description: 'Practical, project-based courses'
        }
      ]
    },

    'Mobile Learning Apps': {
      apps: [
        {
          title: 'SoloLearn',
          url: 'https://www.sololearn.com/',
          description: 'Learn coding on mobile with interactive lessons'
        },
        {
          title: 'Grasshopper',
          url: 'https://grasshopper.app/',
          description: 'Learn JavaScript through coding puzzles'
        },
        {
          title: 'Mimo',
          url: 'https://getmimo.com/',
          description: 'Learn programming in bite-sized lessons'
        }
      ]
    },

    'Interactive Coding Platforms': {
      platforms: [
        {
          title: 'freeCodeCamp',
          url: 'https://www.freecodecamp.org/',
          description: 'Free coding bootcamp with certifications'
        },
        {
          title: 'Codecademy',
          url: 'https://www.codecademy.com/',
          description: 'Interactive coding lessons and projects'
        },
        {
          title: 'LeetCode',
          url: 'https://leetcode.com/',
          description: 'Coding challenges and interview preparation'
        }
      ]
    }
  };

  /**
   * Get comprehensive resources for a skill
   */
  static getSkillResources(skillName) {
    const resources = this.skillResourceMap[skillName];
    if (!resources) {
      return {
        websites: [{
          title: `Learn ${skillName} - MDN`,
          url: 'https://developer.mozilla.org/en-US/docs/Learn',
          description: `General learning resources for ${skillName}`
        }],
        videos: [{
          title: `${skillName} Tutorial`,
          url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(skillName + ' tutorial'),
          channel: 'Various',
          description: `YouTube search results for ${skillName}`
        }]
      };
    }
    return resources;
  }

  /**
   * Get project-specific resources
   */
  static getProjectResources(projectName) {
    return this.projectResourceMap[projectName] || {
      tutorials: [{
        title: `${projectName} Tutorial`,
        url: 'https://www.youtube.com/results?search_query=' + encodeURIComponent(projectName + ' tutorial'),
        description: `Tutorial for building ${projectName}`
      }]
    };
  }

  /**
   * Get learning platform resources
   */
  static getLearningResources(resourceName) {
    return this.learningResourceMap[resourceName] || {
      platforms: [{
        title: resourceName,
        url: 'https://www.google.com/search?q=' + encodeURIComponent(resourceName),
        description: `Search results for ${resourceName}`
      }]
    };
  }

  /**
   * Transform generic resources into detailed resource objects
   */
  static transformResources(resources) {
    const detailedResources = [];

    resources.forEach(resource => {
      // Check if it's a skill
      const skillRes = this.getSkillResources(resource);
      if (skillRes.websites || skillRes.videos || skillRes.courses) {
        detailedResources.push({
          category: 'skill',
          name: resource,
          resources: skillRes
        });
        return;
      }

      // Check if it's a project
      const projectRes = this.getProjectResources(resource);
      if (projectRes.tutorials || projectRes.templates) {
        detailedResources.push({
          category: 'project',
          name: resource,
          resources: projectRes
        });
        return;
      }

      // Check if it's a learning resource
      const learningRes = this.getLearningResources(resource);
      detailedResources.push({
        category: 'learning',
        name: resource,
        resources: learningRes
      });
    });

    return detailedResources;
  }

  /**
   * Generate comprehensive learning recommendations with real URLs
   */
  static generateRecommendations(skills, resources, learningPreferences = []) {
    const recommendations = [];

    // Skills-based recommendations
    skills.forEach(skill => {
      const skillResources = this.getSkillResources(skill);
      
      if (learningPreferences.includes('visual') && skillResources.videos) {
        recommendations.push({
          title: `Master ${skill} with Video Tutorials`,
          type: 'video_course',
          url: skillResources.videos[0]?.url,
          description: skillResources.videos[0]?.description || `Video tutorials for ${skill}`,
          estimatedTime: skillResources.videos[0]?.duration || '2-4 hours',
          priority: 'High'
        });
      }

      if (skillResources.websites) {
        recommendations.push({
          title: `${skill} Documentation & Guides`,
          type: 'documentation',
          url: skillResources.websites[0]?.url,
          description: skillResources.websites[0]?.description || `Official documentation for ${skill}`,
          estimatedTime: '1-2 weeks',
          priority: 'Medium'
        });
      }

      if (skillResources.courses) {
        recommendations.push({
          title: skillResources.courses[0]?.title || `${skill} Course`,
          type: 'online_course',
          url: skillResources.courses[0]?.url,
          description: `Comprehensive course for ${skill}`,
          estimatedTime: '4-8 weeks',
          priority: learningPreferences.includes('structured') ? 'High' : 'Medium'
        });
      }
    });

    // Resource-based recommendations
    resources.forEach(resource => {
      const resourceDetails = this.getLearningResources(resource);
      if (resourceDetails.platforms) {
        recommendations.push({
          title: resource,
          type: 'platform',
          url: resourceDetails.platforms[0]?.url,
          description: resourceDetails.platforms[0]?.description || `Learning platform: ${resource}`,
          estimatedTime: 'Ongoing',
          priority: 'Medium'
        });
      }
    });

    return recommendations.slice(0, 6); // Limit to top 6 recommendations
  }
}

module.exports = ResourceMappingService;