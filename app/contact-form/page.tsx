"use client";
import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { useForm } from "react-hook-form";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { HebrewDateInput } from "@/components/ui/hebrew-date-input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";

function ContactFormContent() {
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [showTitle, setShowTitle] = useState(true);
  const [showFrame, setShowFrame] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [inIframe, setInIframe] = useState(false);

  const searchParams = useSearchParams();

  useEffect(() => {
    // Check URL parameters
    const formTitle = searchParams.get("formtitle");
    const formFrame = searchParams.get("formframe");
    const iframeParam = searchParams.get("iniframe");

    // Set title visibility (default true if not specified or 'true')
    setShowTitle(formTitle === null || formTitle === "true");

    // Set frame visibility (default true if not specified or 'true')
    setShowFrame(formFrame === null || formFrame === "true");

    // Set iframe mode (default false if not specified or 'false')
    setInIframe(iframeParam === "true");
  }, [searchParams]);

  const form = useForm({
    defaultValues: {
      "בחרי פעילות": "",
      שם: "",
      טלפון: "",
      "תאריך לידה משוער": "",
      "יום הולדת של התינוק": "",
      הערות: "",
      "איך הגעתן אלי?": "",
      "מי המליץ": "",
    },
    mode: "onTouched",
  });
  const activity = form.watch("בחרי פעילות");
  const howFound = form.watch("איך הגעתן אלי?");

  return (
    <div dir="rtl" lang="he" className="min-h-screen bg-white text-gray-900">
      {/* Main Content - Full width layout */}
      <main
        dir="rtl"
        className="flex flex-col items-center pt-8 pb-8 bg-white px-[20px] w-full max-w-4xl mx-auto"
      >
        {/* Page Title - Conditional */}
        {showTitle && (
          <div className="w-full text-center mb-8">
            <h1
              style={{
                fontSize: 48,
                fontWeight: 400,
                color: "#333",
                fontFamily: "Rubik, sans-serif",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              צרו איתי קשר
            </h1>
            <p
              style={{
                fontSize: 18,
                fontWeight: 400,
                color: "#333",
                fontFamily: "Rubik, sans-serif",
                textAlign: "center",
                marginBottom: 24,
              }}
            >
              אשמח לעזור לכם במסע שלכם. מלאו את הטופס ונחזור אליכם בהקדם
            </p>
          </div>
        )}

        {/* Contact Form - Full width with max width */}
        <div className="w-full max-w-2xl">
          <Form {...form}>
            <form
              dir="rtl"
              className={`w-full flex flex-col gap-4 font-[Rubik] ${
                showFrame
                  ? "bg-white rounded-[10px] shadow-[0_0_8px_4px_rgba(102,102,102,0.16)] border border-[#D1D5DB] p-8"
                  : ""
              } ${isSubmitting ? "opacity-60 pointer-events-none" : ""}`}
              onSubmit={(e) => {
                e.preventDefault();
                setHasSubmitted(true);
                form.handleSubmit(async (data) => {
                  setError(null);
                  setIsSubmitting(true);
                  const payload = {
                    name: data["שם"],
                    phone: data["טלפון"],
                    email: "",
                    activityType: data["בחרי פעילות"],
                    birthdate: data["תאריך לידה משוער"] || null,
                    babyBirthdate: data["יום הולדת של התינוק"] || null,
                    message: data["הערות"] || "",
                    howFound: data["איך הגעתן אלי?"] || "",
                    referrerName: data["מי המליץ"] || "",
                  };
                  if (!payload.name || !payload.phone || !payload.activityType) {
                    setError("נא למלא את כל השדות הנדרשים.");
                    setIsSubmitting(false);
                    return;
                  }
                  try {
                    const response = await fetch("/api/contact-submissions", {
                      method: "POST",
                      headers: {
                        "Content-Type": "application/json",
                      },
                      body: JSON.stringify(payload),
                    });

                    if (!response.ok) {
                      throw new Error("Failed to submit form");
                    }

                    const result = await response.json();
                    console.log("Form submitted successfully:", result);

                    // Handle redirect based on iniframe parameter
                    if (inIframe) {
                      // If iniframe=true, redirect parent window
                      if (window.parent && window.parent !== window) {
                        try {
                          window.parent.location.href = "https://sharonc.me/thankyou_parent/";
                        } catch (err) {
                          // If cross-origin, try postMessage
                          window.parent.postMessage(
                            {
                              type: "REDIRECT",
                              url: "https://sharonc.me/thankyou_parent/",
                            },
                            "*"
                          );
                        }
                      }
                    } else {
                      // If iniframe=false, redirect current window (_self)
                      window.location.href = "https://sharonc.me/thankyou_parent/";
                    }
                  } catch (e) {
                    console.error("Form submission error:", e);
                    setError("שגיאה בשליחת הטופס.");
                    setIsSubmitting(false);
                  }
                })();
              }}
            >
              {showTitle && (
                <h3 className="text-[36px] font-normal text-[#333] text-center mb-7">
                  צרו איתי קשר
                </h3>
              )}

              {/* בחרי פעילות */}
              <FormField
                control={form.control}
                name="בחרי פעילות"
                rules={{ required: "ביחרו פעילות בבקשה" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="block text-[#333] text-[18px] font-bold mb-1 text-right font-[Rubik]">
                      בחרי פעילות <span className="text-black">*</span>
                    </FormLabel>
                    <FormControl>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger
                          className="h-12 min-h-[48px] bg-[#F6F6F6] rounded-[8px] border-none px-4 text-right text-[16px] font-normal w-full font-[Rubik]"
                          dir="rtl"
                        >
                          <SelectValue placeholder="בחרי פעילות" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="text-right">
                          <SelectItem value="הכנה ללידה מרוכז קבוצתי">
                            הכנה ללידה מרוכז קבוצתי
                          </SelectItem>
                          <SelectItem value="הכנה ללידה מפגש רענון">
                            הכנה ללידה מפגש רענון
                          </SelectItem>
                          <SelectItem value="הכנה ללידה קורס פרטי">הכנה ללידה קורס פרטי</SelectItem>
                          <SelectItem value="יוגה לתינוקות">יוגה לתינוקות</SelectItem>
                          <SelectItem value="יוגה נשית">יוגה נשית</SelectItem>
                          <SelectItem value="יוגה לאמהות">יוגה לאמהות</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    {hasSubmitted && fieldState.error && (
                      <div className="text-red-600 text-sm mt-1">ביחרו פעילות בבקשה</div>
                    )}
                  </FormItem>
                )}
              />

              {/* שם */}
              <FormField
                control={form.control}
                name="שם"
                rules={{ required: "נא מלאו שם" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="block text-[#333] text-[18px] font-bold mb-1 text-right font-[Rubik]">
                      שם <span className="text-black">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        dir="rtl"
                        className="h-12 min-h-[48px] bg-[#F6F6F6] rounded-[8px] border-none px-4 text-right text-[16px] font-normal w-full font-[Rubik]"
                        {...field}
                      />
                    </FormControl>
                    {hasSubmitted && fieldState.error && (
                      <div className="text-red-600 text-sm mt-1">נא מלאו שם</div>
                    )}
                  </FormItem>
                )}
              />

              {/* טלפון */}
              <FormField
                control={form.control}
                name="טלפון"
                rules={{ required: "נא מלאו מספר טלפון" }}
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="block text-[#333] text-[18px] font-bold mb-1 text-right font-[Rubik]">
                      טלפון <span className="text-black">*</span>
                    </FormLabel>
                    <FormControl>
                      <Input
                        dir="rtl"
                        className="h-12 min-h-[48px] bg-[#F6F6F6] rounded-[8px] border-none px-4 text-right text-[16px] font-normal w-full font-[Rubik]"
                        type="tel"
                        {...field}
                      />
                    </FormControl>
                    {hasSubmitted && fieldState.error && (
                      <div className="text-red-600 text-sm mt-1">נא מלאו מספר טלפון</div>
                    )}
                  </FormItem>
                )}
              />

              {/* Date Pickers - Conditional */}
              {activity === "יוגה לתינוקות" && (
                <FormField
                  control={form.control}
                  name="יום הולדת של התינוק"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-[#333] text-[18px] font-bold mb-1 text-right font-[Rubik]">
                        יום הולדת של התינוק
                      </FormLabel>
                      <FormControl>
                        <HebrewDateInput dir="rtl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {activity && activity !== "יוגה לתינוקות" && (
                <FormField
                  control={form.control}
                  name="תאריך לידה משוער"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-[#333] text-[18px] font-bold mb-1 text-right font-[Rubik]">
                        תאריך לידה משוער
                      </FormLabel>
                      <FormControl>
                        <HebrewDateInput dir="rtl" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* הערות */}
              <FormField
                control={form.control}
                name="הערות"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-[#333] text-[18px] font-bold mb-1 text-right font-[Rubik]">
                      הערות
                    </FormLabel>
                    <FormControl>
                      <Input
                        dir="rtl"
                        className="h-12 min-h-[48px] bg-[#F6F6F6] rounded-[8px] border-none px-4 text-right text-[16px] font-normal w-full font-[Rubik]"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* איך הגעתן אלי? */}
              <FormField
                control={form.control}
                name="איך הגעתן אלי?"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="block text-[#333] text-[18px] font-bold mb-1 text-right font-[Rubik]">
                      איך הגעתן אלי?
                    </FormLabel>
                    <FormControl>
                      <Select dir="rtl" onValueChange={field.onChange} value={field.value}>
                        <SelectTrigger
                          className="h-12 min-h-[48px] bg-[#F6F6F6] rounded-[8px] border-none px-4 text-right text-[16px] font-normal w-full font-[Rubik]"
                          dir="rtl"
                        >
                          <SelectValue placeholder="ממש לא חובה אבל תמיד טוב לדעת למי לאמר תודה" />
                        </SelectTrigger>
                        <SelectContent dir="rtl" className="text-right">
                          <SelectItem value="פייסבוק">פייסבוק</SelectItem>
                          <SelectItem value="גוגל">גוגל</SelectItem>
                          <SelectItem value="המלצה של חברה או חבר">המלצה של חברה או חבר</SelectItem>
                          <SelectItem value="המלצה של איש או אשת מקצוע">
                            המלצה של איש או אשת מקצוע
                          </SelectItem>
                          <SelectItem value="אחר">אחר</SelectItem>
                        </SelectContent>
                      </Select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* מי המליץ - Conditional */}
              {(howFound === "המלצה של חברה או חבר" ||
                howFound === "המלצה של איש או אשת מקצוע") && (
                <FormField
                  control={form.control}
                  name="מי המליץ"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="block text-[#333] text-[18px] font-bold mb-1 text-right font-[Rubik]">
                        אשמח לדעת מי המליץ כדי להודות להם :)
                      </FormLabel>
                      <FormControl>
                        <Input
                          dir="rtl"
                          className="h-12 min-h-[48px] bg-[#F6F6F6] rounded-[8px] border-none px-4 text-right text-[16px] font-normal w-full font-[Rubik]"
                          {...field}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {error && <div className="text-red-600 text-center mb-2">{error}</div>}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="mt-6 w-full h-[52px] text-[24px] font-bold rounded-[5px] bg-[#00A165] text-white hover:bg-[#008c4a] transition-colors font-[Rubik] disabled:opacity-70"
              >
                {isSubmitting ? "שולח..." : "הרשמה"}
              </Button>
            </form>
          </Form>
        </div>
      </main>
    </div>
  );
}

export default function ContactFormPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ContactFormContent />
    </Suspense>
  );
}

