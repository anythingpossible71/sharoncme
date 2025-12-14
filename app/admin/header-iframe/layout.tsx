import { AdminThemeProvider } from "@/components/admin/AdminThemeProvider";
import "@/app/admin/admin.css";
import "./layout.css";

export default async function HeaderIframeLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* CRITICAL: Blocking script to set theme immediately - must run before any CSS */}
      {/* This prevents the flash of light theme with red background */}
      <script
        dangerouslySetInnerHTML={{
          __html: `
            (function() {
              // CRITICAL: Run immediately, synchronously, before any rendering
              // Set admin theme to light immediately on the HTML element
              const htmlElement = document.documentElement;
              const bodyElement = document.body;
              
              // CRITICAL: Set background color immediately to prevent greenish flash
              // Use admin light theme background: hsl(216 19% 95%)
              if (htmlElement) {
                htmlElement.style.backgroundColor = 'hsl(216 19% 95%)';
              }
              if (bodyElement) {
                bodyElement.style.backgroundColor = 'hsl(216 19% 95%)';
              }
              
              // CRITICAL: Remove any existing dark theme attribute first
              // This prevents dark theme from flashing if it was set previously
              if (htmlElement.hasAttribute('data-admin-theme')) {
                const currentTheme = htmlElement.getAttribute('data-admin-theme');
                if (currentTheme === 'dark') {
                  htmlElement.removeAttribute('data-admin-theme');
                }
              }
              
              // Set localStorage to light (clear any dark theme)
              const savedTheme = localStorage.getItem('admin-theme');
              if (savedTheme && savedTheme !== 'light') {
                localStorage.setItem('admin-theme', 'light');
              }
              
              // Set theme attribute AFTER removing dark theme
              htmlElement.setAttribute('data-admin-theme', 'light');
              
              // Remove any app theme attributes
              if (htmlElement.hasAttribute('data-app-theme')) {
                htmlElement.removeAttribute('data-app-theme');
              }
              
              // Remove app theme classes
              const appThemeClasses = [
                'ocean', 'forest', 'midnight',
                'strawberry-swirl', 'sunset-sorbet', 'lavender-honey',
                'matcha-latte', 'blueberry-cheesecake', 'rocky-road',
                'orange-creamsicle', 'caramel-drizzle', 'cotton-candy',
                'birthday-cake', 'ube', 'lemon-meringue', 'pistachio-almond',
                'tutti-frutti', 'electric-mango', 'raspberry-rush',
                'lime-zing', 'grape-soda', 'cherry-bomb',
                'blue-lagoon', 'supercharged-orange', 'vivid-violet',
                'kiwi-splash', 'passion-fruit-punch'
              ];
              appThemeClasses.forEach(function(themeClass) {
                htmlElement.classList.remove(themeClass);
              });
            })();
          `,
        }}
      />
      <AdminThemeProvider defaultTheme="light">{children}</AdminThemeProvider>
    </>
  );
}
