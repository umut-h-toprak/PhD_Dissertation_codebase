export class FontSettings {
    constructor(defaultFont,defaultFontSize,defaultItalic,defaultBold){
        this.font=defaultFont;
        this.fontSize=defaultFontSize;
        this.isItalic=defaultItalic;
        this.isBold=defaultBold;
    }
    generateFontCssText(coeff=1){
        return `${this.isItalic ? "italic" : "normal"} ${this.isBold ? "bold" : "normal"} ${Math.round(this.fontSize*coeff)}px "${this.font}", sans`;
    }
}