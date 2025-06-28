
"use client";

import { useState, useEffect, useMemo } from 'react';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Loader2, Eye, TrendingUp, ArrowRight } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

type PageView = {
    id: string;
    originalPath: string;
    views: number;
    lastViewed: {
        seconds: number;
        nanoseconds: number;
    } | null;
}

export const AnalyticsManager = () => {
    const [pageViews, setPageViews] = useState<PageView[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            if (!db) return;
            setIsLoading(true);
            try {
                const analyticsCollection = collection(db, 'analytics');
                const q = query(analyticsCollection, orderBy('views', 'desc'));
                const snapshot = await getDocs(q);
                const views = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as PageView));
                setPageViews(views);
            } catch (error) {
                console.error("Error fetching analytics: ", error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    const totalViews = useMemo(() => pageViews.reduce((acc, curr) => acc + curr.views, 0), [pageViews]);
    const uniquePages = pageViews.length;

    if (isLoading) {
        return <div className="flex justify-center items-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div>;
    }

    return (
        <div className="space-y-8">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Views</CardTitle>
                        <Eye className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalViews.toLocaleString()}</div>
                        <p className="text-xs text-muted-foreground">Across all pages</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Unique Pages Tracked</CardTitle>
                        <ArrowRight className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{uniquePages}</div>
                         <p className="text-xs text-muted-foreground">Total number of pages with views</p>
                    </CardContent>
                </Card>
                 <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Most Viewed Page</CardTitle>
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold truncate">{pageViews[0]?.originalPath || 'N/A'}</div>
                        <p className="text-xs text-muted-foreground">
                            with {pageViews[0]?.views.toLocaleString() || 0} views
                        </p>
                    </CardContent>
                </Card>
            </div>
             <Card>
                <CardHeader>
                    <CardTitle>Page View Breakdown</CardTitle>
                    <CardDescription>A list of all tracked pages and their view counts.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Page Path</TableHead>
                                <TableHead className="text-right">Views</TableHead>
                                <TableHead className="text-right">Last Viewed</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {pageViews.map(view => (
                                <TableRow key={view.id}>
                                    <TableCell className="font-medium">{view.originalPath}</TableCell>
                                    <TableCell className="text-right">{view.views.toLocaleString()}</TableCell>
                                    <TableCell className="text-right">
                                        {view.lastViewed ? formatDistanceToNow(new Date(view.lastViewed.seconds * 1000), { addSuffix: true }) : 'N/A'}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
            <Card>
                <CardHeader>
                    <CardTitle>Next Steps: Button Click Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">To track clicks on important buttons (like "Summarize Article" or "Analyze Post"), we can create a similar system. It would involve another server action and calling it from the `onClick` handler of those specific buttons. This would give you insight into which features are being used most often.</p>
                </CardContent>
            </Card>
        </div>
    );
};
