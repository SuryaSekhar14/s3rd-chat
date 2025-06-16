"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
	return (
		<div className="flex flex-col items-center justify-center min-h-screen w-full p-4 text-center">
			<div className="space-y-6 max-w-md mx-auto">
				<h1 className="text-6xl font-bold">404</h1>
				<h2 className="text-2xl font-semibold">Page Not Found</h2>
				<p className="text-muted-foreground">
					Oops! The page you are looking for doesn&apos;t exist or has been moved.
				</p>
				<div className="pt-4">
					<Button asChild>
						<Link href="/">
							Return Home
						</Link>
					</Button>
				</div>
			</div>
		</div>
	);
} 