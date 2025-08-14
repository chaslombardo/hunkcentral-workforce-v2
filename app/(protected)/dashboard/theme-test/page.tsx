import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"

export default function ThemeTestPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Theme Test Page</h1>
        <p className="text-muted-foreground">
          Test theme switching functionality across different components.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Light Theme Elements</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button variant="default">Primary Button</Button>
            <Button variant="secondary">Secondary Button</Button>
            <Button variant="outline">Outline Button</Button>
            <div className="flex gap-2">
              <Badge>Default Badge</Badge>
              <Badge variant="secondary">Secondary Badge</Badge>
              <Badge variant="outline">Outline Badge</Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Brand Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="h-8 bg-hunks-green rounded flex items-center justify-center text-white text-sm">
              Hunks Green
            </div>
            <div className="h-8 bg-hunks-orange rounded flex items-center justify-center text-white text-sm">
              Hunks Orange
            </div>
            <div className="h-8 bg-primary rounded flex items-center justify-center text-primary-foreground text-sm">
              Primary Color
            </div>
            <div className="h-8 bg-secondary rounded flex items-center justify-center text-secondary-foreground text-sm">
              Secondary Color
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Text Colors</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <p className="text-foreground">Foreground text</p>
            <p className="text-muted-foreground">Muted foreground text</p>
            <p className="text-primary">Primary text</p>
            <p className="text-secondary-foreground">Secondary text</p>
            <p className="text-destructive">Destructive text</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Background Colors</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-4">
            <div className="p-4 bg-background border rounded">
              <p className="text-sm font-medium">Background</p>
              <p className="text-xs text-muted-foreground">Main background</p>
            </div>
            <div className="p-4 bg-card border rounded">
              <p className="text-sm font-medium">Card</p>
              <p className="text-xs text-muted-foreground">Card background</p>
            </div>
            <div className="p-4 bg-muted border rounded">
              <p className="text-sm font-medium">Muted</p>
              <p className="text-xs text-muted-foreground">Muted background</p>
            </div>
            <div className="p-4 bg-accent border rounded">
              <p className="text-sm font-medium">Accent</p>
              <p className="text-xs text-muted-foreground">Accent background</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}