"use client"

import { useRef, useState, useCallback, useEffect } from "react"
import { Mic, ArrowUp } from "lucide-react"
import { cn } from "@/lib/utils"

interface ChatInputProps {
  placeholder?: string
  isMobile?: boolean
  onSubmit?: (text: string) => void
  disabled?: boolean
}

export function ChatInput({
  placeholder,
  isMobile = false,
  onSubmit,
  disabled = false,
}: ChatInputProps) {
  const [value, setValue] = useState("")
  const [listening, setListening] = useState(false)
  const [voiceSupported, setVoiceSupported] = useState(false)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const recognitionRef = useRef<any>(null)
  const hasText = value.trim().length > 0

  // Set up Web Speech API for voice input (if available)
  useEffect(() => {
    if (typeof window === "undefined") return
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    if (!SpeechRecognition) return

    setVoiceSupported(true)
    const recognition = new SpeechRecognition()
    recognition.continuous = false
    recognition.interimResults = true
    recognition.lang = "en-US"

    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((r: any) => r[0].transcript)
        .join("")
      setValue(transcript)
    }
    recognition.onend = () => setListening(false)
    recognition.onerror = () => setListening(false)

    recognitionRef.current = recognition
    return () => {
      try {
        recognition.stop()
      } catch {}
    }
  }, [])

  const toggleVoice = () => {
    const recognition = recognitionRef.current
    if (!recognition) return
    if (listening) {
      recognition.stop()
      setListening(false)
    } else {
      try {
        recognition.start()
        setListening(true)
      } catch {
        setListening(false)
      }
    }
  }

  const adjustHeight = useCallback(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = "auto"
    el.style.height = Math.min(el.scrollHeight, 160) + "px"
    el.style.overflowY = el.scrollHeight > 160 ? "auto" : "hidden"
  }, [])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value)
    adjustHeight()
  }

  // Keep height in sync when value changes programmatically (e.g. voice input)
  useEffect(() => {
    adjustHeight()
  }, [value, adjustHeight])

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  const handleSubmit = () => {
    if (!hasText || disabled) return
    onSubmit?.(value.trim())
    setValue("")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  const defaultPlaceholder = isMobile
    ? "Search venues in Hong Kong..."
    : "Tell VenueChat what you\u2019re looking for\u2026"

  return (
    <div className="w-full pointer-events-auto">
      {/* Subtle glow ring on focus */}
      <div className="relative group">
        <div className="absolute -inset-px rounded-2xl bg-gradient-to-r from-[#ffdad4] to-[#e8bdb6] opacity-0 group-focus-within:opacity-40 blur transition duration-500 pointer-events-none" />

        <div
          className={cn(
            "relative bg-[#ffffff] border border-[#e8bdb6]/70 rounded-2xl shadow-sm flex flex-col transition-all duration-300",
            "focus-within:border-[#9e0000]/40 focus-within:shadow-[0_4px_24px_rgba(158,0,0,0.08)]",
            "p-4"
          )}
        >
          <textarea
            ref={textareaRef}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            rows={1}
            disabled={disabled}
            placeholder={placeholder ?? defaultPlaceholder}
            aria-label="Chat input"
            className={cn(
              "w-full bg-transparent border-0 ring-0 p-0 resize-none",
              // 16px on mobile prevents iOS from auto-zooming on focus
              "text-base sm:text-[15px] leading-6 text-[#1a1c1c] placeholder:text-[#926e69]/60",
              "min-h-[48px] max-h-[160px] focus:outline-none focus:ring-0",
              "overflow-y-hidden"
            )}
          />

          <div className="flex justify-end items-center mt-2 h-9">
            {/* Right: mic + send */}
            <div className="flex items-center gap-1">
              {voiceSupported && (
                <button
                  type="button"
                  aria-label={listening ? "Stop voice input" : "Start voice input"}
                  aria-pressed={listening}
                  onClick={toggleVoice}
                  className={cn(
                    "w-8 h-8 flex items-center justify-center rounded-full transition-colors",
                    listening
                      ? "bg-[#9e0000] text-white animate-pulse"
                      : "text-[#5e3f3a] hover:bg-[#eeeeee]",
                  )}
                >
                  <Mic size={17} />
                </button>
              )}

              <button
                aria-label="Send message"
                onClick={handleSubmit}
                disabled={disabled}
                className={cn(
                  "w-8 h-8 flex items-center justify-center rounded-full transition-all disabled:opacity-60 disabled:cursor-not-allowed",
                  hasText
                    ? "bg-[#9e0000] text-white shadow-sm hover:bg-[#cc0000] scale-100"
                    : isMobile
                    ? "bg-[#9e0000] text-white shadow-sm"
                    : "bg-[#eeeeee] text-[#926e69]"
                )}
              >
                <ArrowUp size={16} strokeWidth={2.5} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
