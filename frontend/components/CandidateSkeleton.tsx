
import React from 'react'

export function CandidateSkeleton() {
    return (
        <div className="bg-white rounded-xl border border-zinc-100 p-8 shadow-sm flex flex-col gap-4 animate-pulse">
            <div className="flex items-start justify-between">
                <div className="flex items-center gap-4">
                    {/* Circle Score Skeleton */}
                    <div className="w-16 h-16 rounded-full bg-zinc-100" />

                    <div className="space-y-2">
                        {/* Name Skeleton */}
                        <div className="h-5 w-48 bg-zinc-100 rounded-md" />
                        {/* Meta Info Skeleton */}
                        <div className="flex gap-2">
                            <div className="h-4 w-20 bg-zinc-50 rounded border border-zinc-100" />
                            <div className="h-4 w-24 bg-zinc-50 rounded" />
                        </div>
                    </div>
                </div>

                <div className="flex gap-1">
                    <div className="w-8 h-8 rounded-lg bg-zinc-50" />
                    <div className="w-8 h-8 rounded-lg bg-zinc-50" />
                </div>
            </div>

            {/* Rationale Skeleton */}
            <div className="h-10 w-full bg-zinc-50 rounded-xl" />

            {/* Skills Skeleton */}
            <div className="flex gap-2">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-6 w-16 bg-zinc-50 rounded-lg" />
                ))}
            </div>

            {/* Footer Skeleton */}
            <div className="mt-auto pt-3 border-t border-zinc-50 flex justify-between">
                <div className="h-4 w-32 bg-zinc-50 rounded-full" />
                <div className="h-4 w-20 bg-zinc-50 rounded" />
            </div>
        </div>
    )
}
