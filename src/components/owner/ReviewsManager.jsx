import React, { useState } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Star, MessageSquare, Send, Check } from "lucide-react";
import { toast } from "sonner";

export default function ReviewsManager({ reviews, responses, courts, onRespond, isLoading }) {
  const [respondingTo, setRespondingTo] = useState(null);
  const [responseText, setResponseText] = useState("");

  const handleSubmitResponse = () => {
    if (!responseText.trim()) {
      toast.error("Escribe una respuesta");
      return;
    }
    onRespond(respondingTo, responseText.trim());
    setRespondingTo(null);
    setResponseText("");
  };

  // Group reviews by court
  const reviewsByCourt = courts.map(court => ({
    court,
    reviews: reviews.filter(r => r.court_id === court.id)
  })).filter(g => g.reviews.length > 0);

  const getResponse = (reviewId) => responses.find(r => r.review_id === reviewId);

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-semibold text-lg">Reseñas de clientes</h3>
        <p className="text-sm text-slate-500">{reviews.length} reseñas en total</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Total reseñas</p>
            <p className="text-2xl font-bold">{reviews.length}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Promedio</p>
            <div className="flex items-center gap-1">
              <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              <p className="text-2xl font-bold">
                {reviews.length > 0 
                  ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
                  : "0.0"
                }
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Sin responder</p>
            <p className="text-2xl font-bold text-amber-600">
              {reviews.filter(r => !getResponse(r.id)).length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-sm text-slate-500">Respondidas</p>
            <p className="text-2xl font-bold text-green-600">
              {reviews.filter(r => getResponse(r.id)).length}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Reviews by Court */}
      {reviewsByCourt.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Star className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No tienes reseñas aún</p>
          </CardContent>
        </Card>
      ) : (
        reviewsByCourt.map(({ court, reviews: courtReviews }) => (
          <Card key={court.id}>
            <CardHeader>
              <CardTitle className="text-base flex items-center justify-between">
                {court.name}
                <div className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm font-normal">
                    {(courtReviews.reduce((sum, r) => sum + r.rating, 0) / courtReviews.length).toFixed(1)}
                  </span>
                  <span className="text-sm text-slate-400">({courtReviews.length})</span>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {courtReviews.map(review => {
                const response = getResponse(review.id);
                return (
                  <div key={review.id} className="border rounded-xl p-4">
                    {/* Review */}
                    <div className="flex items-start gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback className="bg-slate-100">
                          {(review.user_name || "U").charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <p className="font-medium">{review.user_name || "Usuario"}</p>
                          <span className="text-xs text-slate-400">
                            {format(new Date(review.created_date), "d MMM yyyy", { locale: es })}
                          </span>
                        </div>
                        <div className="flex items-center gap-1 mt-1">
                          {[1, 2, 3, 4, 5].map(star => (
                            <Star 
                              key={star} 
                              className={`h-4 w-4 ${star <= review.rating ? 'fill-amber-400 text-amber-400' : 'text-slate-200'}`}
                            />
                          ))}
                        </div>
                        {review.comment && (
                          <p className="text-sm text-slate-600 mt-2">{review.comment}</p>
                        )}
                      </div>
                    </div>

                    {/* Response */}
                    {response ? (
                      <div className="mt-4 ml-12 p-3 bg-teal-50 rounded-lg border border-teal-100">
                        <div className="flex items-center gap-2 text-sm text-teal-700 mb-1">
                          <Check className="h-4 w-4" />
                          <span className="font-medium">Tu respuesta</span>
                        </div>
                        <p className="text-sm text-teal-800">{response.response}</p>
                      </div>
                    ) : respondingTo === review.id ? (
                      <div className="mt-4 ml-12">
                        <Textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Escribe tu respuesta..."
                          className="mb-2"
                        />
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => { setRespondingTo(null); setResponseText(""); }}
                          >
                            Cancelar
                          </Button>
                          <Button 
                            size="sm" 
                            className="bg-teal-600"
                            onClick={handleSubmitResponse}
                            disabled={isLoading}
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Enviar
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-4 ml-12">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => setRespondingTo(review.id)}
                        >
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Responder
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
}