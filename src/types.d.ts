import * as React from "react"

declare module "react" {
  namespace JSX {
    interface IntrinsicElements {
      "pixel-canvas": React.DetailedHTMLProps<
        React.HTMLAttributes<HTMLElement> & {
          "data-gap"?: number
          "data-speed"?: number
          "data-colors"?: string
          "data-variant"?: "default" | "icon"
          "data-no-focus"?: string | boolean
          ref?: React.Ref<HTMLElement>
        },
        HTMLElement
      >
    }
  }
}
