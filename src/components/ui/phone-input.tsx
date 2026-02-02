import * as React from "react";
import { useState, useRef, useEffect } from "react";
import { ChevronDown, Phone } from "lucide-react";
import { cn } from "@/lib/utils";

interface Country {
  code: string;
  name: string;
  dialCode: string;
  flag: string;
}

const countries: Country[] = [
  { code: "RU", name: "Россия", dialCode: "+7", flag: "🇷🇺" },
  { code: "KZ", name: "Казахстан", dialCode: "+7", flag: "🇰🇿" },
  { code: "BY", name: "Беларусь", dialCode: "+375", flag: "🇧🇾" },
  { code: "UA", name: "Украина", dialCode: "+380", flag: "🇺🇦" },
  { code: "UZ", name: "Узбекистан", dialCode: "+998", flag: "🇺🇿" },
  { code: "KG", name: "Кыргызстан", dialCode: "+996", flag: "🇰🇬" },
  { code: "TJ", name: "Таджикистан", dialCode: "+992", flag: "🇹🇯" },
  { code: "TM", name: "Туркменистан", dialCode: "+993", flag: "🇹🇲" },
  { code: "AZ", name: "Азербайджан", dialCode: "+994", flag: "🇦🇿" },
  { code: "AM", name: "Армения", dialCode: "+374", flag: "🇦🇲" },
  { code: "GE", name: "Грузия", dialCode: "+995", flag: "🇬🇪" },
  { code: "MD", name: "Молдова", dialCode: "+373", flag: "🇲🇩" },
  { code: "US", name: "США", dialCode: "+1", flag: "🇺🇸" },
  { code: "GB", name: "Великобритания", dialCode: "+44", flag: "🇬🇧" },
  { code: "DE", name: "Германия", dialCode: "+49", flag: "🇩🇪" },
  { code: "FR", name: "Франция", dialCode: "+33", flag: "🇫🇷" },
  { code: "IT", name: "Италия", dialCode: "+39", flag: "🇮🇹" },
  { code: "ES", name: "Испания", dialCode: "+34", flag: "🇪🇸" },
  { code: "PT", name: "Португалия", dialCode: "+351", flag: "🇵🇹" },
  { code: "NL", name: "Нидерланды", dialCode: "+31", flag: "🇳🇱" },
  { code: "BE", name: "Бельгия", dialCode: "+32", flag: "🇧🇪" },
  { code: "CH", name: "Швейцария", dialCode: "+41", flag: "🇨🇭" },
  { code: "AT", name: "Австрия", dialCode: "+43", flag: "🇦🇹" },
  { code: "PL", name: "Польша", dialCode: "+48", flag: "🇵🇱" },
  { code: "CZ", name: "Чехия", dialCode: "+420", flag: "🇨🇿" },
  { code: "SE", name: "Швеция", dialCode: "+46", flag: "🇸🇪" },
  { code: "NO", name: "Норвегия", dialCode: "+47", flag: "🇳🇴" },
  { code: "FI", name: "Финляндия", dialCode: "+358", flag: "🇫🇮" },
  { code: "DK", name: "Дания", dialCode: "+45", flag: "🇩🇰" },
  { code: "TR", name: "Турция", dialCode: "+90", flag: "🇹🇷" },
  { code: "AE", name: "ОАЭ", dialCode: "+971", flag: "🇦🇪" },
  { code: "IL", name: "Израиль", dialCode: "+972", flag: "🇮🇱" },
  { code: "CN", name: "Китай", dialCode: "+86", flag: "🇨🇳" },
  { code: "JP", name: "Япония", dialCode: "+81", flag: "🇯🇵" },
  { code: "KR", name: "Южная Корея", dialCode: "+82", flag: "🇰🇷" },
  { code: "IN", name: "Индия", dialCode: "+91", flag: "🇮🇳" },
  { code: "TH", name: "Таиланд", dialCode: "+66", flag: "🇹🇭" },
  { code: "VN", name: "Вьетнам", dialCode: "+84", flag: "🇻🇳" },
  { code: "ID", name: "Индонезия", dialCode: "+62", flag: "🇮🇩" },
  { code: "MY", name: "Малайзия", dialCode: "+60", flag: "🇲🇾" },
  { code: "SG", name: "Сингапур", dialCode: "+65", flag: "🇸🇬" },
  { code: "AU", name: "Австралия", dialCode: "+61", flag: "🇦🇺" },
  { code: "NZ", name: "Новая Зеландия", dialCode: "+64", flag: "🇳🇿" },
  { code: "BR", name: "Бразилия", dialCode: "+55", flag: "🇧🇷" },
  { code: "MX", name: "Мексика", dialCode: "+52", flag: "🇲🇽" },
  { code: "AR", name: "Аргентина", dialCode: "+54", flag: "🇦🇷" },
  { code: "CA", name: "Канада", dialCode: "+1", flag: "🇨🇦" },
  { code: "EG", name: "Египет", dialCode: "+20", flag: "🇪🇬" },
  { code: "ZA", name: "ЮАР", dialCode: "+27", flag: "🇿🇦" },
];

interface PhoneInputProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  className?: string;
}

export function PhoneInput({ value, onChange, placeholder, required, className }: PhoneInputProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCountry, setSelectedCountry] = useState<Country>(countries[0]); // Default Russia
  const [localNumber, setLocalNumber] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Format phone number based on country
  const formatNumber = (num: string, country: Country) => {
    const digits = num.replace(/\D/g, '');
    
    if (country.dialCode === "+7") {
      // Russian/Kazakh format: +7 (XXX) XXX-XX-XX
      let formatted = '';
      if (digits.length > 0) formatted += '(' + digits.slice(0, 3);
      if (digits.length > 3) formatted += ') ' + digits.slice(3, 6);
      if (digits.length > 6) formatted += '-' + digits.slice(6, 8);
      if (digits.length > 8) formatted += '-' + digits.slice(8, 10);
      return formatted;
    }
    
    // Generic format with spaces
    return digits.replace(/(\d{3})(\d{3})(\d{4})/, '$1 $2 $3').trim();
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const digits = inputValue.replace(/\D/g, '').slice(0, 10);
    const formatted = formatNumber(digits, selectedCountry);
    setLocalNumber(formatted);
    onChange(selectedCountry.dialCode + digits);
  };

  const handleCountrySelect = (country: Country) => {
    setSelectedCountry(country);
    setIsOpen(false);
    onChange(country.dialCode + localNumber.replace(/\D/g, ''));
    inputRef.current?.focus();
  };

  return (
    <div className={cn("relative", className)} ref={dropdownRef}>
      <div className="relative flex items-center">
        {/* Country selector button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="absolute left-3 flex items-center gap-1.5 text-white/80 hover:text-white z-10 py-2 pr-2 border-r border-white/20"
        >
          <span className="text-xl">{selectedCountry.flag}</span>
          <ChevronDown className={cn("w-4 h-4 transition-transform", isOpen && "rotate-180")} />
        </button>

        {/* Phone input */}
        <input
          ref={inputRef}
          type="tel"
          value={`${selectedCountry.dialCode} ${localNumber}`}
          onChange={handleNumberChange}
          onFocus={(e) => {
            // Position cursor after dial code
            const dialCodeLength = selectedCountry.dialCode.length + 1;
            if (e.target.selectionStart !== null && e.target.selectionStart < dialCodeLength) {
              setTimeout(() => e.target.setSelectionRange(dialCodeLength, dialCodeLength), 0);
            }
          }}
          placeholder={placeholder || `${selectedCountry.dialCode} (___) ___-__-__`}
          required={required}
          className="w-full pl-20 pr-4 h-14 bg-transparent border border-white/20 rounded-2xl text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none focus:ring-0"
        />
      </div>

      {/* Country dropdown */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl z-50 max-h-64 overflow-y-auto scrollbar-hide">
          {countries.map((country) => (
            <button
              key={country.code}
              type="button"
              onClick={() => handleCountrySelect(country)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 hover:bg-white/10 transition-colors text-left",
                selectedCountry.code === country.code && "bg-white/10"
              )}
            >
              <span className="text-xl">{country.flag}</span>
              <span className="text-white flex-1">{country.name}</span>
              <span className="text-white/50">{country.dialCode}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
