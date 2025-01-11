import Link from "next/link";

export default function NotFound() {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center p-4 bg-background text-foreground">
            <div className="max-w-md w-full border-2 border-foreground rounded-lg p-8 text-center space-y-4">
                <h1 className="text-4xl sm:text-5xl font-bold mb-4">404</h1>
                <p className="text-lg sm:text-xl mb-6">
                    Oops! The page you&apos;re looking for doesn&apos;t exist.
                </p>
                <div className="animate-pulse">
                    <Link 
                        href="/" 
                        className="inline-block px-6 py-3 border-2 border-foreground rounded-lg 
                                 hover:bg-foreground hover:text-background transition-colors 
                                 duration-300 text-sm sm:text-base"
                    >
                        Return Home
                    </Link>
                </div>
            </div>
        </div>
    );
}