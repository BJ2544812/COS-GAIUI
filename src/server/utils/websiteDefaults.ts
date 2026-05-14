export type SectionType = 'hero' | 'text' | 'image' | 'sermon_list' | 'event_list' | 'giving_cta' | 'contact_form';

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
  },
  {
    id: 'modern',
    name: 'Modern Worship',
    description: 'Vibrant, high-energy design for contemporary worship and city-wide outreach.',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            type: 'hero',
            config: {
              variant: 'split',
              title: 'Find Your Purpose',
              subtitle: 'Join a community passionate about Jesus, people, and making a real difference in the world.',
              buttonText: 'Join the Movement',
              serviceTimes: 'Sundays at 9 AM • 11 AM • 5 PM',
              overlayOpacity: 0.5
            }
          },
          {
            type: 'text',
            config: {
              title: 'Our Mission',
              content: 'We exist to reach the unreached, equip believers, and transform our city through authentic worship and radical generosity. Everyone is welcome here.',
              alignment: 'center'
            }
          },
          { type: 'event_list', config: { title: 'Get Involved', limit: 4 } },
          { type: 'sermon_list', config: { title: 'Watch Latest', limit: 3 } },
          {
            type: 'giving_cta',
            config: {
              title: 'Invest in the Kingdom',
              description: 'Partner with us as we reach our city with the message of hope and restoration.',
              buttonText: 'Give Now'
            }
          },
          {
            type: 'contact_form',
            config: {
              title: 'Connect With Us'
            }
          }
        ]
      },
      {
        slug: 'about',
        title: 'About',
        sections: [
          { type: 'hero', config: { variant: 'split', title: 'Our Passion', subtitle: 'Jesus. People. Purpose.' } },
          { type: 'text', config: { title: 'The Vision', content: 'We exist to reach the unreached and build a community of fully devoted followers of Christ. Everything we do is about making the name of Jesus known in our city.' } }
        ]
      },
      { slug: 'sermons', title: 'Watch', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Live & On-Demand', subtitle: 'Messages designed for your journey.' } }, { type: 'sermon_list', config: { title: 'Recent Series', limit: 12 } }] },
      { slug: 'events', title: 'Events', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Next Steps', subtitle: 'Your place in the story starts here.' } }, { type: 'event_list', config: { title: 'Upcoming Events', limit: 15 } }] },
      { slug: 'giving', title: 'Giving', sections: [{ type: 'hero', config: { variant: 'split', title: 'Make an Impact', subtitle: 'Your generosity changes lives.' } }, { type: 'giving_cta', config: { title: 'Fast & Secure', buttonText: 'Give Online' } }] },
      { slug: 'contact', title: 'Connect', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Connect', subtitle: 'We are better together.' } }, { type: 'contact_form', config: { title: 'Say Hello' } }] }
    ]
  },
  {
    id: 'youth',
    name: 'Youth Church',
    description: 'Bold, dynamic design for students, active discipleship, and vibrant expression.',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            type: 'hero',
            config: {
              variant: 'split',
              title: 'BOLD FAITH. REAL COMMUNITY.',
              subtitle: 'A place to be yourself, find your squad, and follow Jesus together.',
              buttonText: 'I\'m New Here',
              serviceTimes: 'Wednesdays 7 PM • Sundays 11 AM',
              overlayOpacity: 0.4
            }
          },
          {
            type: 'text',
            config: {
              title: 'This Is Us',
              content: 'We are a group of students and young adults chasing after Jesus and having a blast doing it. No perfect people allowed—just Christ followers who are real about the journey.',
              alignment: 'center'
            }
          },
          { type: 'event_list', config: { title: 'Camps & Hangouts', limit: 4 } },
          { type: 'sermon_list', config: { title: 'Latest Talks', limit: 3 } },
          {
            type: 'giving_cta',
            config: {
              title: 'Support the Vision',
              description: 'Help us empower the next generation with resources and mission opportunities.',
              buttonText: 'Invest in Students'
            }
          },
          {
            type: 'contact_form',
            config: {
              title: 'Get Connected'
            }
          }
        ]
      },
      { 
        slug: 'about', 
        title: 'About', 
        sections: [
          { type: 'hero', config: { variant: 'minimal', title: 'Our Vibe', subtitle: 'No perfect people allowed.' } },
          { type: 'text', config: { title: 'The Crew', content: 'We are a group of students and leaders who are chasing after Jesus and having a ton of fun doing it. Whether you are a seeker or a long-time follower, you belong here.' } }
        ]
      },
      { slug: 'sermons', title: 'Talks', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Real Talk', subtitle: 'Messages for your world.' } }, { type: 'sermon_list', config: { title: 'Archive', limit: 10 } }] },
      { slug: 'events', title: 'Calendar', sections: [{ type: 'hero', config: { variant: 'centered', title: 'The Schedule', subtitle: 'Don\'t miss the next big thing.' } }, { type: 'event_list', config: { title: 'Upcoming', limit: 10 } }] },
      { slug: 'giving', title: 'Support', sections: [{ type: 'hero', config: { variant: 'minimal', title: 'Fuel the Mission', subtitle: 'Help us make a difference.' } }, { type: 'giving_cta', config: { title: 'Support Youth', buttonText: 'Give' } }] },
      { slug: 'contact', title: 'Connect', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Get Linked', subtitle: 'Send us a message or DM.' } }, { type: 'contact_form', config: { title: 'Contact Us' } }] }
    ]
  },
  {
    id: 'minimal',
    name: 'Minimal Church',
    description: 'Clean, typography-driven design for communities that value focus and quiet depth.',
    pages: [
      {
        slug: 'home',
        title: 'Home',
        sections: [
          {
            type: 'hero',
            config: {
              variant: 'minimal',
              title: 'Faith. Simplified.',
              subtitle: 'Focusing on the essentials of worship, study, and loving our neighbors.',
              buttonText: 'Visit Us',
              serviceTimes: 'Sunday at 10 AM',
              overlayOpacity: 0.6
            }
          },
          {
            type: 'text',
            config: {
              title: 'The Core',
              content: 'We believe faith is a journey of quiet depth and active love. Our community centers on the simple teachings of Christ, stripped of unnecessary complexity.',
              alignment: 'center'
            }
          },
          { type: 'event_list', config: { title: 'Gatherings', limit: 3 } },
          { type: 'sermon_list', config: { title: 'Weekly Reflections', limit: 3 } },
          {
            type: 'giving_cta',
            config: {
              title: 'Contribution',
              description: 'Supporting our shared work in the neighborhood.',
              buttonText: 'Contribute'
            }
          },
          {
            type: 'contact_form',
            config: {
              title: 'Reach Out'
            }
          }
        ]
      },
      {
        slug: 'about',
        title: 'About',
        sections: [
          { type: 'hero', config: { variant: 'minimal', title: 'Our Story', subtitle: 'A simple path.' } },
          { type: 'text', config: { title: 'Essentials', content: 'We value silence, scripture, and service. Our community is built on the belief that less is often more when it comes to experiencing the presence of God.' } }
        ]
      },
      { slug: 'sermons', title: 'Teachings', sections: [{ type: 'hero', config: { variant: 'minimal', title: 'Sermons', subtitle: 'Weekly reflections.' } }, { type: 'sermon_list', config: { title: 'Recent', limit: 8 } }] },
      { slug: 'events', title: 'Events', sections: [{ type: 'hero', config: { variant: 'minimal', title: 'Gatherings', subtitle: 'Quiet moments together.' } }, { type: 'event_list', config: { title: 'Upcoming', limit: 10 } }] },
      { slug: 'giving', title: 'Support', sections: [{ type: 'hero', config: { variant: 'minimal', title: 'Support', subtitle: 'Contributing to the mission.' } }, { type: 'giving_cta', config: { title: 'Giving', buttonText: 'Support' } }] },
      { slug: 'contact', title: 'Contact', sections: [{ type: 'hero', config: { variant: 'minimal', title: 'Inquiry', subtitle: 'Get in touch with our team.' } }, { type: 'contact_form', config: { title: 'Message Us' } }] }
    ]
  },
  {
    id: 'flagship-1',
    name: 'Flagship Church',
    description: 'A comprehensive 10-page experience for growing churches with ministries, leadership, and next steps.',
    pages: [
      { slug: 'home', title: 'Home', sections: [{ type: 'hero', config: { title: 'Welcome Home', subtitle: 'A community of faith and grace.', buttonText: 'Visit Us' } }, { type: 'text', config: { title: 'Our Mission', content: 'Transforming lives through the love of Christ.', alignment: 'center' } }, { type: 'event_list', config: { title: 'Upcoming Events' } }, { type: 'sermon_list', config: { title: 'Latest Sermons' } }, { type: 'giving_cta', config: { title: 'Support Our Work' } }] },
      { slug: 'about', title: 'About', sections: [{ type: 'hero', config: { variant: 'minimal', title: 'Our Story' } }, { type: 'text', config: { title: 'Who We Are', content: 'We are a family-focused church dedicated to scripture and service.' } }] },
      { slug: 'ministries', title: 'Ministries', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Our Ministries', subtitle: 'Find your place to serve and grow.' } }, { type: 'text', config: { title: 'Kids & Youth', content: 'Nurturing the next generation in faith.' } }, { type: 'text', config: { title: 'Adult Groups', content: 'Growing deeper together in small groups.' } }] },
      { slug: 'sermons', title: 'Sermons', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Messages', subtitle: 'Watch and listen to our latest series.' } }, { type: 'sermon_list', config: { title: 'Video Archive' } }] },
      { slug: 'events', title: 'Events', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Calendar', subtitle: 'Stay connected with our community.' } }, { type: 'event_list', config: { title: 'Full Schedule' } }] },
      { slug: 'giving', title: 'Giving', sections: [{ type: 'hero', config: { variant: 'minimal', title: 'Generosity' } }, { type: 'giving_cta', config: { title: 'Secure Online Giving', description: 'Thank you for your faithful support.', buttonText: 'Give Now' } }] },
      { slug: 'prayer', title: 'Prayer', sections: [{ type: 'hero', config: { variant: 'minimal', title: 'Prayer Requests' } }, { type: 'contact_form', config: { title: 'How can we pray for you?' } }] },
      { slug: 'contact', title: 'Contact', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Contact Us' } }, { type: 'contact_form', config: { title: 'Get in Touch' } }] },
      { slug: 'leadership', title: 'Leadership', sections: [{ type: 'hero', config: { variant: 'minimal', title: 'Our Team' } }, { type: 'text', config: { title: 'Pastoral Staff', content: 'Meet those who serve our congregation.' } }] },
      { slug: 'next-steps', title: 'Next Steps', sections: [{ type: 'hero', config: { variant: 'centered', title: 'Next Steps', subtitle: 'New here? Here is how to get started.' } }, { type: 'text', config: { title: 'Growth Track', content: 'Learn more about our church and how to become a member.' } }] }
    ]
  }
];

export const DEFAULT_PAGES = WEBSITE_TEMPLATES[0].pages;
