import './globals.scss';
import { NextUIProvider } from "@nextui-org/react";
import { Golos_Text } from 'next/font/google';
import { Suspense } from 'react';

const golos = Golos_Text({
    subsets: ['cyrillic', 'latin'],
});

export const metadata = {
    title: "Ублюдский склад",
    // icons: {
    //     icon: '/newfavi.png',
    // },
};

const RootLayout = ({ children }) => {
    return (
        <html lang="ru">
            <body /* className={golos.className} */>
                <NextUIProvider className={'min-h-full flex flex-col'}>
                    <Suspense>
                        {children}
                    </Suspense>
                </NextUIProvider>
            </body>
        </html>
    );
};

export default RootLayout;