@startuml
left to right direction

actor Student
actor "AI Model" as AI

rectangle "AI Learning Assistant" {
  rectangle "<b>Document Processing" as DP {
    usecase "Read Out Loud" as UC_Read
    usecase "Process PDF Document" as UC_PDF
    usecase "Generate Questions" as UC_GenQ
  }
  rectangle "<b>Learning Features" as LF {
    usecase "Track Progress" as UC_Track
    usecase "View Analytics" as UC_Analytics
    usecase "Evaluate Answers" as UC_Eval
    usecase "Search" as UC_Search
  }
  rectangle "<b>Authentication" as Auth {
    usecase "Login" as UC_Login
    usecase "Register Account" as UC_Register
  }
}

' Authentication
Student --> UC_Login
Student --> UC_Register

' Document Processing
Student --> UC_Read
Student --> UC_PDF

UC_PDF --> UC_GenQ

' Learning Features
Student --> UC_Track
Student --> UC_Analytics
Student --> UC_Eval
Student --> UC_Search

' AI Model interactions
UC_GenQ --> AI
UC_Eval --> AI
UC_Search --> AI

@enduml