import { useState, useMemo } from "react";
import { Calculator, TrendingDown, TrendingUp, Calendar, PiggyBank, X, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

interface PaymentScheduleItem {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

export function MortgageCalculator() {
  const [isOpen, setIsOpen] = useState(false);
  const [propertyPrice, setPropertyPrice] = useState(10000000);
  const [downPayment, setDownPayment] = useState(2000000);
  const [term, setTerm] = useState(20);
  const [rate, setRate] = useState(16);
  const [paymentType, setPaymentType] = useState<"annuity" | "differentiated">("annuity");

  const downPaymentPercent = Math.round((downPayment / propertyPrice) * 100);
  const loanAmount = propertyPrice - downPayment;

  const calculations = useMemo(() => {
    const monthlyRate = rate / 100 / 12;
    const totalMonths = term * 12;

    if (paymentType === "annuity") {
      // Аннуитетный платёж
      const monthlyPayment = loanAmount * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                            (Math.pow(1 + monthlyRate, totalMonths) - 1);
      const totalPayment = monthlyPayment * totalMonths;
      const overpayment = totalPayment - loanAmount;

      // График платежей (первые 12 месяцев + последние 3)
      const schedule: PaymentScheduleItem[] = [];
      let balance = loanAmount;
      
      for (let i = 1; i <= totalMonths; i++) {
        const interest = balance * monthlyRate;
        const principal = monthlyPayment - interest;
        balance -= principal;
        
        if (i <= 12 || i > totalMonths - 3) {
          schedule.push({
            month: i,
            payment: monthlyPayment,
            principal,
            interest,
            balance: Math.max(0, balance),
          });
        }
      }

      return {
        monthlyPayment,
        totalPayment,
        overpayment,
        schedule,
        lastPayment: monthlyPayment,
      };
    } else {
      // Дифференцированный платёж
      const principalPayment = loanAmount / totalMonths;
      const schedule: PaymentScheduleItem[] = [];
      let balance = loanAmount;
      let totalPayment = 0;
      let firstPayment = 0;
      let lastPayment = 0;

      for (let i = 1; i <= totalMonths; i++) {
        const interest = balance * monthlyRate;
        const payment = principalPayment + interest;
        totalPayment += payment;
        balance -= principalPayment;

        if (i === 1) firstPayment = payment;
        if (i === totalMonths) lastPayment = payment;

        if (i <= 12 || i > totalMonths - 3) {
          schedule.push({
            month: i,
            payment,
            principal: principalPayment,
            interest,
            balance: Math.max(0, balance),
          });
        }
      }

      return {
        monthlyPayment: firstPayment,
        totalPayment,
        overpayment: totalPayment - loanAmount,
        schedule,
        lastPayment,
      };
    }
  }, [loanAmount, rate, term, paymentType]);

  const formatPrice = (value: number) => {
    return Math.round(value).toLocaleString("ru-RU") + " ₽";
  };

  const formatShortPrice = (value: number) => {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1).replace(".0", "") + " млн ₽";
    }
    return Math.round(value / 1000) + " тыс ₽";
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          className="w-full h-14 rounded-2xl border-2 border-primary/30 bg-primary/5 text-primary font-medium hover:bg-primary/10 gap-3"
        >
          <Calculator className="w-5 h-5" />
          Ипотечный калькулятор
        </Button>
      </SheetTrigger>
      
      <SheetContent side="bottom" className="h-[90vh] rounded-t-3xl p-0">
        <div className="flex flex-col h-full">
          <SheetHeader className="px-4 py-4 border-b border-border">
            <div className="flex items-center justify-between">
              <SheetTitle className="flex items-center gap-2">
                <Calculator className="w-5 h-5 text-primary" />
                Ипотечный калькулятор
              </SheetTitle>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-5 h-5" />
              </Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
            {/* Property Price */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base">Стоимость недвижимости</Label>
                <span className="text-lg font-bold text-primary">{formatShortPrice(propertyPrice)}</span>
              </div>
              <Slider
                value={[propertyPrice]}
                onValueChange={(v) => {
                  setPropertyPrice(v[0]);
                  if (downPayment > v[0] * 0.9) setDownPayment(v[0] * 0.1);
                }}
                min={1000000}
                max={100000000}
                step={500000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 млн</span>
                <span>100 млн</span>
              </div>
            </div>

            {/* Down Payment */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base">Первоначальный взнос</Label>
                <div className="text-right">
                  <span className="text-lg font-bold text-primary">{formatShortPrice(downPayment)}</span>
                  <span className="text-sm text-muted-foreground ml-2">({downPaymentPercent}%)</span>
                </div>
              </div>
              <Slider
                value={[downPayment]}
                onValueChange={(v) => setDownPayment(v[0])}
                min={propertyPrice * 0.1}
                max={propertyPrice * 0.9}
                step={100000}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>10%</span>
                <span>90%</span>
              </div>
            </div>

            {/* Term */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base">Срок кредита</Label>
                <span className="text-lg font-bold text-primary">{term} лет</span>
              </div>
              <Slider
                value={[term]}
                onValueChange={(v) => setTerm(v[0])}
                min={1}
                max={30}
                step={1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1 год</span>
                <span>30 лет</span>
              </div>
            </div>

            {/* Interest Rate */}
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label className="text-base">Процентная ставка</Label>
                <span className="text-lg font-bold text-primary">{rate}%</span>
              </div>
              <Slider
                value={[rate]}
                onValueChange={(v) => setRate(v[0])}
                min={1}
                max={30}
                step={0.1}
              />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>1%</span>
                <span>30%</span>
              </div>
            </div>

            {/* Payment Type */}
            <div className="space-y-3">
              <Label className="text-base">Тип платежа</Label>
              <Tabs value={paymentType} onValueChange={(v) => setPaymentType(v as "annuity" | "differentiated")}>
                <TabsList className="w-full">
                  <TabsTrigger value="annuity" className="flex-1">Аннуитетный</TabsTrigger>
                  <TabsTrigger value="differentiated" className="flex-1">Дифференцированный</TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            {/* Results */}
            <div className="bg-gradient-to-br from-primary/5 to-primary/10 rounded-2xl p-5 space-y-4">
              <h3 className="font-semibold text-lg">Результаты расчёта</h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-background rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <Calendar className="w-4 h-4" />
                    {paymentType === "annuity" ? "Ежемесячный платёж" : "Первый платёж"}
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {formatPrice(calculations.monthlyPayment)}
                  </p>
                </div>
                
                {paymentType === "differentiated" && (
                  <div className="bg-background rounded-xl p-4">
                    <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                      <TrendingDown className="w-4 h-4" />
                      Последний платёж
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {formatPrice(calculations.lastPayment)}
                    </p>
                  </div>
                )}
                
                <div className="bg-background rounded-xl p-4">
                  <div className="flex items-center gap-2 text-muted-foreground text-sm mb-1">
                    <PiggyBank className="w-4 h-4" />
                    Сумма кредита
                  </div>
                  <p className="text-xl font-bold text-foreground">
                    {formatShortPrice(loanAmount)}
                  </p>
                </div>
                
                <div className="bg-background rounded-xl p-4">
                  <div className="flex items-center gap-2 text-destructive text-sm mb-1">
                    <TrendingUp className="w-4 h-4" />
                    Переплата
                  </div>
                  <p className="text-xl font-bold text-destructive">
                    {formatShortPrice(calculations.overpayment)}
                  </p>
                </div>
              </div>

              <div className="bg-background rounded-xl p-4">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-sm text-muted-foreground">Общая сумма выплат</span>
                  <span className="text-lg font-bold">{formatShortPrice(calculations.totalPayment)}</span>
                </div>
                
                {/* Visual breakdown */}
                <div className="h-3 rounded-full bg-muted overflow-hidden flex">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(loanAmount / calculations.totalPayment) * 100}%` }}
                  />
                  <div 
                    className="h-full bg-destructive" 
                    style={{ width: `${(calculations.overpayment / calculations.totalPayment) * 100}%` }}
                  />
                </div>
                <div className="flex justify-between mt-2 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-primary" />
                    Основной долг
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-destructive" />
                    Проценты
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Schedule Preview */}
            <div className="space-y-3">
              <h3 className="font-semibold">График платежей</h3>
              <div className="bg-muted/50 rounded-xl overflow-hidden">
                <div className="grid grid-cols-4 gap-2 p-3 bg-muted text-xs font-medium text-muted-foreground">
                  <span>Месяц</span>
                  <span>Платёж</span>
                  <span>Осн. долг</span>
                  <span>Проценты</span>
                </div>
                {calculations.schedule.map((item, idx) => (
                  <div 
                    key={item.month} 
                    className={cn(
                      "grid grid-cols-4 gap-2 p-3 text-sm",
                      idx % 2 === 0 ? "bg-background" : "bg-muted/30"
                    )}
                  >
                    <span className="font-medium">{item.month}</span>
                    <span>{formatPrice(item.payment)}</span>
                    <span className="text-primary">{formatPrice(item.principal)}</span>
                    <span className="text-muted-foreground">{formatPrice(item.interest)}</span>
                  </div>
                ))}
                {calculations.schedule.length < term * 12 && (
                  <div className="p-3 text-center text-sm text-muted-foreground">
                    ... ещё {term * 12 - 15} месяцев ...
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-4 border-t border-border bg-background">
            <Button className="w-full h-12 rounded-xl">
              Оставить заявку на ипотеку
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
