from django.urls import path, include
from rest_framework.routers import DefaultRouter
from . import views

router = DefaultRouter()
router.register(r'expenses', views.ExpenseViewSet, basename='expense')
router.register(r'anomalies', views.AnomalyViewSet, basename='anomaly')
router.register(r'reports', views.ImportBatchViewSet, basename='report')

urlpatterns = [
    path('', include(router.urls)),
    path('me/', views.me),
    path('import/', views.import_csv),
    path('dashboard/stats/', views.dashboard_stats),
    path('ai/explain/<int:anomaly_id>/', views.ai_explain),
]
