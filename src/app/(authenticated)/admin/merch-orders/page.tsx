"use client";

import { useState, useEffect, useTransition } from "react";
import { getMerchOrders, markOrderAsSent } from "./actions";
import type { MerchOrder } from "@/types";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Package, Check, Inbox } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";

export default function MerchOrdersPage() {
    const { user } = useAuth();
    const { toast } = useToast();
    const [orders, setOrders] = useState<MerchOrder[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);

    const fetchOrders = async () => {
        setIsLoading(true);
        try {
            const fetchedOrders = await getMerchOrders();
            setOrders(fetchedOrders);
        } catch (error) {
            toast({ variant: "destructive", title: "Klaida", description: "Nepavyko gauti užsakymų sąrašo." });
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user?.isAdmin) {
            fetchOrders();
        } else {
            setIsLoading(false);
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const handleMarkAsSent = async (orderId: string) => {
        setUpdatingId(orderId);
        const result = await markOrderAsSent(orderId);
        if (result.success) {
            toast({ title: "Atlikta!", description: "Užsakymas pažymėtas kaip išsiųstas." });
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: 'SENT', sentAt: new Date().toISOString() } : o));
        } else {
            toast({ variant: "destructive", title: "Klaida", description: result.error });
        }
        setUpdatingId(null);
    };

    if (!user?.isAdmin) {
        return (
            <Card>
                <CardHeader><CardTitle>Prieiga negalima</CardTitle></CardHeader>
                <CardContent><p>Šis puslapis prieinamas tik administratoriams.</p></CardContent>
            </Card>
        );
    }
    
    return (
        <Card>
            <CardHeader>
                <CardTitle>Partnerių Atributikos Užsakymai</CardTitle>
                <CardDescription>Peržiūrėkite ir valdykite įmonių pateiktus atributikos užsakymus.</CardDescription>
            </CardHeader>
            <CardContent>
                <div className="border rounded-md">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>Data</TableHead>
                                <TableHead>Įmonė</TableHead>
                                <TableHead>Gavėjas</TableHead>
                                <TableHead>Adresas</TableHead>
                                <TableHead>Būsena</TableHead>
                                <TableHead className="text-right">Veiksmai</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {isLoading ? (
                                [...Array(5)].map((_, i) => (
                                    <TableRow key={i}>
                                        <TableCell><Skeleton className="h-5 w-24" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-32" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-40" /></TableCell>
                                        <TableCell><Skeleton className="h-5 w-48" /></TableCell>
                                        <TableCell><Skeleton className="h-6 w-20" /></TableCell>
                                        <TableCell className="text-right"><Skeleton className="h-9 w-28 ml-auto" /></TableCell>
                                    </TableRow>
                                ))
                            ) : orders.length === 0 ? (
                                <TableRow>
                                    <TableCell colSpan={6} className="h-48 text-center">
                                        <Inbox className="mx-auto h-12 w-12 text-muted-foreground" />
                                        <p className="mt-2 text-muted-foreground">Naujų užsakymų nėra.</p>
                                    </TableCell>
                                </TableRow>
                            ) : (
                                orders.map((order) => (
                                    <TableRow key={order.id}>
                                        <TableCell>{new Date(order.createdAt).toLocaleDateString('lt-LT')}</TableCell>
                                        <TableCell className="font-medium">{order.companyName}</TableCell>
                                        <TableCell>
                                            <div>{order.recipient}</div>
                                            <div className="text-xs text-muted-foreground">{order.phone}</div>
                                        </TableCell>
                                        <TableCell>
                                            <div>{order.address}</div>
                                            <div className="text-xs text-muted-foreground">{order.city}, {order.postalCode}</div>
                                        </TableCell>
                                        <TableCell>
                                            {order.status === 'SENT' ? (
                                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300">Išsiųsta</Badge>
                                            ) : (
                                                <Badge variant="default" className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/50 dark:text-yellow-300">Laukia</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell className="text-right">
                                            {order.status === 'PENDING' && (
                                                <Button
                                                    size="sm"
                                                    onClick={() => handleMarkAsSent(order.id)}
                                                    disabled={updatingId === order.id}
                                                >
                                                    {updatingId === order.id ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                                                    Pažymėti išsiųstą
                                                </Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))
                            )}
                        </TableBody>
                    </Table>
                </div>
            </CardContent>
        </Card>
    );
}
