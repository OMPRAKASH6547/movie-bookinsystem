"use client";

import { SEED_MOVIES } from "@/data/movies";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

export default function AdminMoviesPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <h1 className="font-display text-3xl tracking-tight">Movie management</h1>
        <Button onClick={() => toast.success("Movie form opened")}>Add movie</Button>
      </div>
      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 text-left">
            <tr>
              <th className="p-3 font-medium">Title</th>
              <th className="p-3 font-medium">Status</th>
              <th className="p-3 font-medium">Rating</th>
              <th className="p-3 font-medium">Languages</th>
              <th className="p-3 font-medium">Actions</th>
            </tr>
          </thead>
          <tbody>
            {SEED_MOVIES.map((m) => (
              <tr key={m._id} className="border-t border-border">
                <td className="p-3 font-medium">{m.title}</td>
                <td className="p-3">
                  <Badge variant="outline">{m.status.replace("_", " ")}</Badge>
                </td>
                <td className="p-3">{m.rating}</td>
                <td className="p-3 text-muted-foreground">{m.languages.join(", ")}</td>
                <td className="p-3">
                  <Button size="sm" variant="ghost" onClick={() => toast.info(`Edit ${m.title}`)}>
                    Edit
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
