"use client";

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { BookOpen, Search, ArrowRight, BookMarked } from 'lucide-react';
import { getSubjects } from '@/lib/api/quiz';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Skeleton } from '@/components/ui/Skeleton';
import { DashboardLayout } from '@/components/layout/DashboardLayout';

export default function SubjectsPage() {
  const [searchQuery, setSearchQuery] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['subjects'],
    queryFn: getSubjects,
  });

  const filteredSubjects = data?.results?.filter(subject => 
    subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    subject.description.toLowerCase().includes(searchQuery.toLowerCase())
  ) || [];

  return (
    <DashboardLayout>
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-slate-900 tracking-tight mb-2">Subjects</h1>
        <p className="text-slate-600">Select a subject to start practicing.</p>
      </div>

      <div className="max-w-md mb-8">
        <Input 
          placeholder="Search subjects..." 
          leftIcon={<Search size={18} />}
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
        />
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <Card key={i} className="border-slate-100 shadow-sm p-6">
              <Skeleton className="w-12 h-12 rounded-xl mb-4" />
              <Skeleton className="h-6 w-3/4 mb-2" />
              <Skeleton className="h-4 w-full mb-6" />
              <Skeleton className="h-10 w-full rounded-lg" />
            </Card>
          ))}
        </div>
      ) : filteredSubjects.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {filteredSubjects.map(subject => (
            <Link key={subject.id} href={`/quiz/setup?subject=${subject.id}`}>
              <Card hoverEffect className="border-slate-100 shadow-sm h-full flex flex-col group cursor-pointer">
                <div className="p-6 flex-1 flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-primary-light text-primary flex items-center justify-center mb-4 group-hover:bg-primary group-hover:text-white transition-colors">
                    <BookMarked size={24} />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 mb-2">{subject.name}</h3>
                  <p className="text-sm text-slate-600 flex-1">{subject.description}</p>
                </div>
                
                <div className="p-4 border-t border-slate-100 flex items-center justify-between text-sm font-semibold text-primary group-hover:bg-slate-50 transition-colors">
                  <span>Start Practice</span>
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </Card>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-20 bg-slate-50 rounded-2xl border border-slate-100 border-dashed">
          <BookOpen size={48} className="mx-auto text-slate-300 mb-4" />
          <h3 className="text-xl font-bold text-slate-900 mb-2">No subjects found</h3>
          <p className="text-slate-500">
            {searchQuery ? `No results matching "${searchQuery}"` : "There are no subjects available for your class level yet."}
          </p>
        </div>
      )}
    </DashboardLayout>
  );
}
