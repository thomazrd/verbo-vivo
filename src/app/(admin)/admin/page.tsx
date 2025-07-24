
"use client";

import { useAuth } from "@/hooks/use-auth";
import { DashboardHeader } from "@/components/admin/DashboardHeader";
import { StatCard } from "@/components/admin/StatCard";
import { Button } from "@/components/ui/button";
import { BookCopy, FileText, Lightbulb, Plus } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, getCountFromServer, query, where } from "firebase/firestore";
import { db } from "@/lib/firebase";

export default function AdminDashboardPage() {
    const { userProfile } = useAuth();
    const [stats, setStats] = useState({ studies: 0, drafts: 0, suggestions: 0 });
    const [loadingStats, setLoadingStats] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const studiesCol = collection(db, "studies");
                const suggestionsCol = collection(db, "suggestions");
                
                const publishedQuery = query(studiesCol, where("status", "==", "PUBLISHED"));
                const draftsQuery = query(studiesCol, where("status", "==", "DRAFT"));
                const newSuggestionsQuery = query(suggestionsCol, where("status", "==", "NEW"));
                
                const publishedCount = (await getCountFromServer(publishedQuery)).data().count;
                const draftsCount = (await getCountFromServer(draftsQuery)).data().count;
                const suggestionsCount = (await getCountFromServer(newSuggestionsQuery)).data().count;

                setStats({
                    studies: publishedCount,
                    drafts: draftsCount,
                    suggestions: suggestionsCount
                });
            } catch (error) {
                console.error("Error fetching stats:", error);
            } finally {
                setLoadingStats(false);
            }
        };

        fetchStats();
    }, []);

    return (
        <div className="p-4 sm:p-6 lg:p-8 space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
                <DashboardHeader userName={userProfile?.displayName || "Comandante"} />
                <Button asChild>
                    <Link href="/admin/studies/create">
                        <Plus />
                        Criar Novo Estudo
                    </Link>
                </Button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                <StatCard 
                    title="Estudos Publicados" 
                    count={stats.studies}
                    icon={BookCopy}
                    href="/admin/studies?status=PUBLISHED"
                    isLoading={loadingStats}
                />
                 <StatCard 
                    title="Rascunhos" 
                    count={stats.drafts}
                    icon={FileText}
                    href="/admin/studies?status=DRAFT"
                    isLoading={loadingStats}
                />
                 <StatCard 
                    title="Novas Sugestões" 
                    count={stats.suggestions}
                    icon={Lightbulb}
                    href="/admin/suggestions"
                    isLoading={loadingStats}
                />
            </div>
        </div>
    );
}
