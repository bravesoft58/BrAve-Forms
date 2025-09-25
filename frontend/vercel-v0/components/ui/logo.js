"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Logo = Logo;
const image_1 = __importDefault(require("next/image"));
const link_1 = __importDefault(require("next/link"));
const utils_1 = require("@/lib/utils");
function Logo({ className, showText = true, size = "md", href = "/" }) {
    const sizes = {
        sm: { container: "h-10", logo: 40 }, // Increased from h-8 and 32
        md: { container: "h-12", logo: 48 }, // Increased from h-10 and 40
        lg: { container: "h-16", logo: 64 }, // Increased from h-12 and 48
    };
    const logoComponent = (<div className={(0, utils_1.cn)("flex items-center gap-2", className)}>
      <div className={(0, utils_1.cn)("relative", sizes[size].container, sizes[size].container)}>
        <image_1.default src="/images/brave-logo.png" alt="BrAve Forms Logo" width={sizes[size].logo} height={sizes[size].logo} className="object-contain" priority/>
      </div>
      {showText && (<span className={(0, utils_1.cn)("font-bold", size === "lg" ? "text-2xl" : size === "md" ? "text-xl" : "text-lg")}>
          BrAve Forms
        </span>)}
    </div>);
    if (href) {
        return <link_1.default href={href}>{logoComponent}</link_1.default>;
    }
    return logoComponent;
}
//# sourceMappingURL=logo.js.map