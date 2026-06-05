export type SectionType = 
  | 'hero' 
  | 'text' 
  | 'image' 
  | 'sermon_list' 
  | 'event_list' 
  | 'giving_cta' 
  | 'contact_form'
  | 'welcome_vision'
  | 'ministry_grid'
  | 'leadership_grid'
  | 'testimonials'
  | 'giving_impact'
  | 'qr_payment'
  | 'prayer_cta'
  | 'next_steps'
  | 'worship'
  | 'stats_bar'
  | 'timeline'
  | 'values'
  | 'faq'
  | 'ministry_highlight'
  | 'pastoral_note'
  | 'vision_statement';

export interface PageSection {
  id: string;
  type: SectionType;
  config: any;
  isVisible?: boolean;
}

export interface WebsiteTemplate {
  id: string;
  name: string;
  description: string;
  pages: {
    slug: string;
    title: string;
    sections: Omit<PageSection, 'id'>[];
  }[];
}

export const WEBSITE_TEMPLATES: WebsiteTemplate[] = [
  {
    id: 'flagship-v2',
    name: 'Premium Ministry',
    description: 'The definitive 10-page Kingdom OS experience. Fully integrated with ERP modules, cinematic design, and intentional discipleship pathways.',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Welcome Home', subtitle: 'A community centered on the radical love of Jesus and the pursuit of His purpose.', imageUrl: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&q=80&w=2000' } },
          { type: 'text', config: { alignment: 'center', title: 'Gather With Us', content: 'Sunday Services: 9:00 AM • 11:00 AM • 5:00 PM\nExperience the presence of God through music, prayer, and authentic community.' } },
          { type: 'vision_statement', config: { title: 'Built for Glory', subtitle: 'To reach people far from God and teach them how to follow Jesus step by radical step.' } },
          { type: 'pastoral_note', config: { title: 'A Message from Our Pastors', author: 'Pastors David & Sarah Chen', message: 'We believe that church isn\'t just a building you visit, but a family where you truly belong and are deeply loved.' } },
          { type: 'ministry_grid', config: { title: 'Find Your Tribe' } },
          { type: 'event_list', config: { title: 'Featured Gatherings', limit: 2 } },
          { type: 'sermon_list', config: { title: 'Latest Message', limit: 1 } },
          { type: 'giving_cta', config: { title: 'Support the Vision', buttonText: 'Give Online', description: 'Your generosity enables us to serve our city and share the message of Jesus globally.' } }
        ]
      },
      {
        slug: 'about',
        title: 'About',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Our Heritage', subtitle: 'A legacy of faith, anchored in the truth of the Gospel and the power of the Spirit.', imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2000' } },
          { type: 'timeline', config: { title: 'The Journey' } },
          { type: 'values', config: { title: 'The Kingdom DNA' } },
          { type: 'leadership_grid', config: { title: 'The Team' } },
          { type: 'pastoral_note', config: { title: 'Come As You Are', message: 'We are a church of second chances and new beginnings. You don\'t have to have it all figured out to be a part of what God is doing here.', author: 'Pastoral Team' } }
        ]
      },
      {
        slug: 'ministries',
        title: 'Ministries',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Connect & Serve', subtitle: 'Discover a place where you can grow, belong, and use your unique gifts for His glory.', imageUrl: 'https://images.unsplash.com/photo-1493225255756-d9584f8606e9?auto=format&fit=crop&q=80&w=2000' } },
          { type: 'ministry_highlight', config: { title: 'Grace Kids', subtitle: 'A safe, high-energy environment where your children can discover the love of Jesus through play and biblical teaching.', imageUrl: 'https://images.unsplash.com/photo-1491438590914-bc09fcaaf77a?auto=format&fit=crop&q=80&w=1000' } },
          { type: 'ministry_grid', config: { title: 'Opportunities' } },
          { type: 'ministry_highlight', config: { title: 'The Collective', subtitle: 'Empowering the next generation to live with influence through authentic discipleship and community.', imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=1000', reversed: true } },
          { type: 'next_steps', config: { title: 'Find Your Next Step' } }
        ]
      },
      {
        slug: 'sermons',
        title: 'Sermons',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'The Message', subtitle: 'Explore teachings centered on the timeless truth of Scripture and the person of Jesus.', imageUrl: 'https://images.unsplash.com/photo-1516280440614-37939bbacd81?auto=format&fit=crop&q=80&w=2000' } },
          { type: 'worship', config: { title: 'Atmosphere of Praise' } },
          { type: 'sermon_list', config: { title: 'Watch Latest', limit: 12 } }
        ]
      },
      {
        slug: 'events',
        title: 'Events',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Gatherings', subtitle: 'Life happens in community. Join us for what\'s next in the life of our church.', imageUrl: 'https://images.unsplash.com/photo-1523580494863-6f3031224c94?auto=format&fit=crop&q=80&w=2000' } },
          { type: 'event_list', config: { title: 'Full Calendar', limit: 20 } },
          { type: 'faq', config: { title: 'Event FAQs' } }
        ]
      },
      {
        slug: 'giving',
        title: 'Giving',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Radical Generosity', subtitle: 'Join us in fueling a movement of grace through faithful and visionary stewardship.', imageUrl: 'https://images.unsplash.com/photo-1532629345422-7515f3d16bb6?auto=format&fit=crop&q=80&w=2000' } },
          { type: 'text', config: { alignment: 'center', title: 'The Heart of Giving', content: 'We believe giving is an response to the grace we have received. Your partnership enables every outreach, mission, and moment of transformation.' } },
          { type: 'giving_impact', config: { title: 'Collective Impact', campaigns: [
            { title: 'Local Care Hub', progress: 65, target: '$25,000', current: '$16,250', desc: 'Expanding our reach to serve underprivileged families in our neighborhood.' },
            { title: 'Global Mission Partners', progress: 80, target: '$40,000', current: '$32,000', desc: 'Supporting sustainable gospel work across our international partner networks.' }
          ] } },
          { type: 'qr_payment', config: { title: 'Quick & Secure', fundName: 'Vision Fund' } },
          { type: 'giving_cta', config: { title: 'Partner With Us', buttonText: 'Give Online' } }
        ]
      },
      {
        slug: 'prayer',
        title: 'Prayer',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Stand Together', subtitle: 'We believe in the power of persistent prayer and the active presence of God.', imageUrl: 'https://images.unsplash.com/photo-1444491741275-3747c53c99b4?auto=format&fit=crop&q=80&w=2000' } },
          { type: 'text', config: { alignment: 'center', title: 'Pastoral Encouragement', content: '"Do not be anxious about anything, but in every situation, by prayer and petition, with thanksgiving, present your requests to God." — Philippians 4:6' } },
          { type: 'pastoral_note', config: { title: 'We Pray For You', message: 'Our pastoral team and intercessors are dedicated to standing in the gap for you with honor and faith.', author: 'Grace Prayer Team' } },
          { type: 'testimonials', config: { title: 'Testimonies of Faith' } },
          { type: 'prayer_cta', config: { title: 'How Can We Pray?', subtitle: 'Share your heart with our private and confidential prayer team.' } }
        ]
      },
      {
        slug: 'next-steps',
        title: 'Next Steps',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Your Journey', subtitle: 'Finding your place in God\'s story and walking with purpose in community.', imageUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&q=80&w=2000' } },
          { 
            type: 'next_steps', 
            config: { 
              title: 'Discover Your Path',
              steps: [
                { title: 'New to Faith', desc: 'A guided introduction to the radical love and message of Jesus Christ.', icon: 'Sparkles' },
                { title: 'Public Baptism', desc: 'Declare your faith publicly and join the family through baptism.', icon: 'Video' },
                { title: 'Covenant Membership', desc: 'Commit to the vision and find your unique place in the community.', icon: 'Users' },
                { title: 'Ministry Serve', desc: 'Use your God-given gifts to build the Kingdom and serve others.', icon: 'Heart' }
              ]
            } 
          },
          { type: 'vision_statement', config: { title: 'Follow Him', subtitle: 'Helping people far from God discover their identity and purpose in Christ.' } }
        ]
      },
      {
        slug: 'leadership',
        title: 'Leadership',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'The Stewards', subtitle: 'A team dedicated to serving God and His people with integrity and pastoral vision.', imageUrl: 'https://images.unsplash.com/photo-1517048676732-d65bc937f952?auto=format&fit=crop&q=80&w=2000' } },
          { type: 'leadership_grid', config: { title: 'Pastoral Team', staff: [
            { name: 'Pastors David & Sarah Chen', role: 'Lead Visionaries', bio: 'David and Sarah lead Grace Community with a focus on radical grace and biblical truth.', quote: 'Our joy is seeing people discover their God-given potential.' },
            { name: 'Marcus Wright', role: 'Worship Director', bio: 'Marcus leads our creative teams in crafting atmospheres of praise and devotion.', quote: 'Worship is our lifestyle, not just our Sunday morning.' },
            { name: 'Jessica Miller', role: 'Executive Pastor', bio: 'Jessica oversees the operations and discipleship pathways of our church family.', quote: 'Excellence in ministry honors God and inspires people.' }
          ] } },
          { type: 'pastoral_note', config: { title: 'Built to Serve', message: 'We lead by serving. Our greatest honor is walking alongside you in your journey of faith.', author: 'Senior Leadership' } }
        ]
      },
      {
        slug: 'contact',
        title: 'Contact',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Get In Touch', subtitle: 'Connect with our team digitally or join us at our campus this weekend.', imageUrl: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&q=80&w=2000' } },
          { type: 'contact_form', config: { title: 'Reach Out', subtitle: 'General inquiries, baptism interest, or pastoral needs.' } },
          { type: 'faq', config: { title: 'Got Questions?' } }
         ]
      },
      {
        slug: 'portal',
        title: 'Portal',
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Church Portal', subtitle: 'Continue to the Kingdom OS portal for members, teams, and ministry operations.' } },
          { type: 'next_steps', config: { title: 'Portal Access Steps', steps: [
            { title: 'Member Login', desc: 'Use your church credentials to access your dashboard.', icon: 'Users' },
            { title: 'Team Workspace', desc: 'Serve teams can review schedules, tasks, and updates.', icon: 'Layout' },
            { title: 'Need Help?', desc: 'Contact the office if you need login support.', icon: 'Heart' },
            { title: 'Open Platform', desc: 'Launch Kingdom OS securely.', icon: 'ArrowRight' }
          ] } }
        ]
      }
    ]
  },
  {
    id: 'cinematic',
    name: 'Showcase Cinema',
    description: 'Max visual impact for modern ministry brands. Immersive imagery, glassmorphism, and cinematic storytelling.',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          { type: 'hero', config: { variant: 'split', title: 'Pursue Your Purpose', subtitle: 'Join a community of faith and discovery.', imageUrl: 'cinematic_worship_hero_1778791392579.png' } },
          { type: 'worship', config: { title: 'Experience the Presence', subtitle: 'Worship that engages the heart.', imageUrl: 'cinematic_worship_hero_1778791392579.png' } },
          { type: 'text', config: { title: 'Our Culture', content: 'We are a church that loves God and loves people.', alignment: 'center' } },
          { type: 'sermon_list', config: { title: 'The Library', limit: 3 } },
          { type: 'giving_impact', config: { title: 'Transformation Stories' } },
          { type: 'qr_payment', config: { title: 'Support the Vision' } }
        ]
      }
    ]
  },
  {
    id: 'classic',
    name: 'Classic Church',
    description: 'A timeless, elegant design focused on tradition and multi-generational community.',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            type: 'hero',
            config: {
              variant: 'centered',
              title: 'Welcome to Our Church Home',
              subtitle: 'A place where tradition meets community, and faith is nurtured across every generation.',
              buttonText: 'Plan Your Visit',
              serviceTimes: 'Sunday Services: 8:00 AM • 10:30 AM',
              overlayOpacity: 0.7
            }
          },
          {
            type: 'text',
            config: {
              title: 'A Legacy of Faith',
              content: 'For over 50 years, we have been a cornerstone of grace in our city. We invite you to experience a community dedicated to the authority of scripture and the warmth of family fellowship.',
              alignment: 'center'
            }
          },
          { type: 'event_list', config: { title: 'Upcoming Fellowship', limit: 4 } },
          { type: 'sermon_list', config: { title: 'Recent Messages', limit: 3 } },
          {
            type: 'giving_cta',
            config: {
              title: 'Faithful Stewardship',
              description: 'Your generosity enables our mission to serve the local community and share the gospel globally.',
              buttonText: 'Support Our Ministry'
            }
          },
          {
            type: 'contact_form',
            config: {
              title: 'Visit Us'
            }
          }
        ]
      },
      {
        slug: 'about',
        title: 'About',
        sections: [
          { type: 'hero', config: { variant: 'minimal', title: 'Our Heritage', subtitle: 'Walking in faith together since 1974.' } },
          { type: 'text', config: { title: 'What We Believe', content: 'We hold firmly to the historic Christian faith, centered on the transformative power of the Gospel. Our mission is to make disciples who love God and love others.' } }
        ]
      },
      { 
        slug: 'sermons', 
        title: 'Sermons', 
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'The Living Word', subtitle: 'Explore our archive of weekly messages.' } }, 
          { type: 'sermon_list', config: { title: 'Latest Teachings', limit: 9 } }
        ] 
      },
      { 
        slug: 'events', 
        title: 'Events', 
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Gatherings', subtitle: 'Stay connected through our community calendar.' } }, 
          { type: 'event_list', config: { title: 'Full Calendar', limit: 20 } }
        ] 
      },
      { 
        slug: 'giving', 
        title: 'Giving', 
        sections: [
          { type: 'hero', config: { variant: 'minimal', title: 'Graceful Giving', subtitle: 'An act of worship and gratitude.' } }, 
          { type: 'giving_cta', config: { title: 'Secure Online Giving', description: 'Your gift supports worship, compassion, and outreach.', buttonText: 'Give online', showOptions: true } }
        ] 
      },
      { 
        slug: 'contact', 
        title: 'Contact', 
        sections: [
          { type: 'hero', config: { variant: 'centered', title: 'Reach Out', subtitle: 'We would love to hear from you.' } }, 
          { type: 'contact_form', config: { title: 'Get in Touch' } }
        ] 
      }
    ]
  }
];

export const DEFAULT_PAGES = WEBSITE_TEMPLATES[0].pages;
