import type React from "react"

import { useState, useRef } from "react"
import { useForm, FormProvider } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Upload, Download, FileText, Plus, ChevronRight } from "lucide-react"
import { type VCardData, defaultVCardData, parseVcf, downloadVcf } from "@/lib/vcf-utils"
import { ContactForm } from "@/components/contact-form"
import { ContactPreview } from "@/components/contact-preview"
import { toast } from "sonner"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

export function VcfEditor() {
  const [version, setVersion] = useState<"3.0" | "4.0">("4.0")
  const [showPreview, setShowPreview] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const methods = useForm<VCardData>({
    defaultValues: defaultVCardData,
  })

  const watchedData = methods.watch()

  const handleImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      const text = await file.text()
      const parsedData = parseVcf(text)
      methods.reset(parsedData)
      toast.success("Contact imported", {
        description:
          `Successfully imported ${parsedData.firstName} ${parsedData.lastName}`.trim() || "Contact data loaded",
      })
    } catch {
      toast.error("Import failed", {
        description: "Could not parse the VCF file",
      })
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleExport = () => {
    const data = methods.getValues()
    downloadVcf(data, version)
    toast.success("Contact exported", {
      description: `VCF ${version} file downloaded successfully`,
    })
  }

  const handleNew = () => {
    methods.reset(defaultVCardData)
    toast("Form cleared", {
      description: "Ready to create a new contact",
    })
  }

  return (
    <FormProvider {...methods}>
      <div className="flex min-h-screen">
        {/* Form Panel */}
        <div className={cn("flex-1 transition-all duration-300", showPreview ? "hidden lg:block lg:flex-1" : "w-full")}>
          <div className="container mx-auto max-w-3xl px-4 py-6">
            <Card className="border-border/50 shadow-lg">
              <CardHeader className="border-b border-border/50 bg-card">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <FileText className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">vCard Editor</CardTitle>
                      <p className="text-sm text-muted-foreground">Create and edit VCF contacts</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Button variant="outline" size="sm" onClick={handleNew} className="gap-1.5 bg-transparent">
                      <Plus className="h-4 w-4" />
                      New
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      className="gap-1.5"
                    >
                      <Upload className="h-4 w-4" />
                      Import
                    </Button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept=".vcf,.vcard"
                      onChange={handleImport}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setShowPreview(true)}
                      className="gap-1.5 lg:hidden"
                    >
                      Preview
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                    <div className="flex items-center gap-2">
                      <Select value={version} onValueChange={(v) => setVersion(v as "3.0" | "4.0")}>
                        <SelectTrigger className="h-9 w-24">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="4.0">v4.0</SelectItem>
                          <SelectItem value="3.0">v3.0</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button size="sm" onClick={handleExport} className="gap-1.5">
                        <Download className="h-4 w-4" />
                        Export
                      </Button>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="p-6">
                <ContactForm />
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Preview Panel - sticky on desktop, full-screen on mobile when active */}
        <div
          className={cn(
            "border-l border-border/50 bg-card/50 transition-all duration-300",
            showPreview
              ? "fixed inset-0 z-50 bg-background lg:static lg:z-auto lg:w-[400px] lg:bg-transparent"
              : "hidden lg:block lg:w-[400px]",
          )}
        >
          <div className="sticky top-0 flex h-screen flex-col">
            <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
              <h2 className="font-semibold">Live Preview</h2>
              <Button variant="ghost" size="sm" onClick={() => setShowPreview(false)} className="lg:hidden">
                Back to form
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <ContactPreview data={watchedData} />
            </div>
          </div>
        </div>
      </div>
      <Toaster />
    </FormProvider>
  )
}
