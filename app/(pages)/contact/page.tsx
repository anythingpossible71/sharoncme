import { getCurrentUser } from "@/lib/auth/permissions";
import { getAppSettings } from "@/app/actions/app-settings";
import { InnerPageTemplate } from "@/components/templates/InnerPageTemplate";
import { ContactForm } from "@/components/contact/ContactForm";
import { Card, CardContent } from "@/components/ui/card";
import { Mail, Phone, MapPin, Clock, MessageSquare, Send } from "lucide-react";
import type { Metadata } from "next";

export const dynamic = "force-dynamic";

// pageDescription: Get in touch with our team through our contact form or find our office locations and support channels

export const metadata: Metadata = {
  title: "Contact Us",
  description:
    "Get in touch with our team through our contact form or find our office locations and support channels",
  openGraph: {
    title: "Contact Us",
    description:
      "Get in touch with our team through our contact form or find our office locations and support channels",
    images: ["/app/(pages)/contact/preview.png"],
  },
};

export default async function ContactPage() {
  const currentUser = await getCurrentUser();
  const appSettings = await getAppSettings();

  return (
    <InnerPageTemplate
      currentUser={currentUser}
      appName={appSettings.appName}
      appLogoUrl={appSettings.appLogoUrl}
      heroTitle="Get In Touch"
      heroSubtitle="Have a question or want to learn more? We'd love to hear from you. Send us a message and we'll respond as soon as possible."
      heroIcon={<Mail className="h-6 w-6 text-primary" />}
    >
      <section className="py-16 md:py-24">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-12">
              {/* Contact Form - Takes 2 columns on large screens */}
              <div className="lg:col-span-2">
                <Card>
                  <CardContent className="p-6">
                    <div className="space-y-4 mb-8">
                      <h2 className="text-3xl font-bold">Send Us a Message</h2>
                      <p className="text-muted-foreground">
                        Fill out the form below and we&apos;ll get back to you within 24 hours. For
                        urgent matters, please call us directly.
                      </p>
                    </div>
                    <ContactForm />
                  </CardContent>
                </Card>
              </div>

              {/* Contact Information - Takes 1 column on large screens */}
              <div className="space-y-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Mail className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Email</h3>
                        <p className="text-sm text-muted-foreground">Send us an email anytime</p>
                        <a
                          href="mailto:support@example.com"
                          className="text-sm text-primary hover:underline mt-1 block"
                        >
                          support@example.com
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Phone className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Phone</h3>
                        <p className="text-sm text-muted-foreground">
                          Call us during business hours
                        </p>
                        <a
                          href="tel:+1234567890"
                          className="text-sm text-primary hover:underline mt-1 block"
                        >
                          +1 (234) 567-890
                        </a>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <MapPin className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Office</h3>
                        <p className="text-sm text-muted-foreground">
                          Visit us at our headquarters
                        </p>
                        <p className="text-sm mt-1">
                          123 Business Street
                          <br />
                          Suite 100
                          <br />
                          City, State 12345
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Clock className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Business Hours</h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          Monday - Friday: 9:00 AM - 6:00 PM
                          <br />
                          Saturday: 10:00 AM - 4:00 PM
                          <br />
                          Sunday: Closed
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <MessageSquare className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Live Chat</h3>
                        <p className="text-sm text-muted-foreground">
                          Chat with our support team in real-time. Available Monday through Friday,
                          9:00 AM - 6:00 PM EST.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="rounded-full bg-primary/10 p-3">
                        <Send className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <h3 className="font-semibold mb-1">Social Media</h3>
                        <p className="text-sm text-muted-foreground">
                          Follow us on social media for updates, announcements, and quick responses
                          to your questions.
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </section>
    </InnerPageTemplate>
  );
}
