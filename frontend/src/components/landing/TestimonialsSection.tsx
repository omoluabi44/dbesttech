import React from 'react';
import { Card } from '../ui/Card';
import { Avatar } from '../ui/Avatar';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: "Adebayo S.",
    role: "SS 3 Student",
    content: "The WAEC past questions feature is incredible. Being able to time myself and see the explanations immediately has boosted my confidence for the real exam.",
    rating: 5
  },
  {
    name: "Mrs. Okon",
    role: "Parent of Primary 4 Pupil",
    content: "My daughter loves the fun animations when she gets a perfect score. It has turned mathematics practice from a chore into a game she looks forward to.",
    rating: 5
  },
  {
    name: "Chioma N.",
    role: "JSS 1 Student",
    content: "The AI generated questions mean I never see the same quiz twice. The performance dashboard helped me realize I needed to focus more on Algebra.",
    rating: 4
  }
];

export const TestimonialsSection: React.FC = () => {
  return (
    <section id="testimonials" className="py-24 bg-surface">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">Loved by students and parents</h2>
          <p className="text-slate-600 text-lg">Don't just take our word for it. See what our users have to say.</p>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="border-slate-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i} 
                      size={18} 
                      className={i < testimonial.rating ? "fill-amber-400 text-amber-400" : "text-slate-200"} 
                    />
                  ))}
                </div>
                <p className="text-slate-700 italic mb-6">"{testimonial.content}"</p>
              </div>
              <div className="flex items-center gap-3">
                <Avatar initials={testimonial.name.charAt(0)} className="bg-primary text-white" />
                <div>
                  <h5 className="font-bold text-slate-900 text-sm">{testimonial.name}</h5>
                  <p className="text-xs text-slate-500">{testimonial.role}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>
        
      </div>
    </section>
  );
};
