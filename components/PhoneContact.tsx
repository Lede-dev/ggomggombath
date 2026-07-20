import { PhoneIcon } from "@/components/PhoneIcon";
import { brand } from "@/data/site";

export function PhoneContact({ className = "" }: { className?: string }) {
  return (
    <div className={`phone-contact ${className}`.trim()}>
      <span className="phone-static">
        <PhoneIcon />
        <strong>{brand.phone}</strong>
      </span>
      <span className="phone-mobile-actions">
        <a className="phone-call-link" href={brand.phoneHref} aria-label={`${brand.phone} 전화 걸기`}>
          <PhoneIcon />
          <strong>{brand.phone}</strong>
        </a>
        <a className="phone-sms-link" href={brand.smsHref} aria-label={`${brand.phone} 문자 보내기`}>
          문자
        </a>
      </span>
    </div>
  );
}
