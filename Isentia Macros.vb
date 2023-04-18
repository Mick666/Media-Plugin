Public Declare PtrSafe Function OpenClipboard Lib "user32" (ByVal hwnd As Long) As Long
Public Declare PtrSafe Function EmptyClipboard Lib "user32" () As Long
Public Declare PtrSafe Function CloseClipboard Lib "user32" () As Long


Sub AddHeaderFooter(control As IRibbonControl)

    ' In the current document, insert the Header
    ActiveDocument.AttachedTemplate.BuildingBlockEntries("mm_header") _
        .Insert Where:=Selection.Range, RichText:=True
    
    ' Insert the document Footer
    Selection.InsertBreak Type:=wdPageBreak
    
    ActiveDocument.AttachedTemplate.BuildingBlockEntries("mm_footer") _
        .Insert Where:=Selection.Range, RichText:=True
        
    Selection.GoTo What:=wdGoToBookmark, Name:="startpoint"
    
    ' Turn off Field Codes
    ActiveWindow.View.ShowFieldCodes = False
End Sub

Sub AddHeaderFooter_ey(control As IRibbonControl)

    ActiveDocument.AttachedTemplate.BuildingBlockEntries("ey_header") _
        .Insert Where:=Selection.Range, RichText:=True
    
    Selection.InsertBreak Type:=wdPageBreak
    
    ActiveDocument.AttachedTemplate.BuildingBlockEntries("ey_footer") _
        .Insert Where:=Selection.Range, RichText:=True
        
    Selection.GoTo What:=wdGoToBookmark, Name:="startpoint"
    
    ' Turn off Field Codes
    ActiveWindow.View.ShowFieldCodes = False
End Sub

Sub InsertMPItems(control As IRibbonControl)
    
    ' Insert a new Topic and media items from MP XLS export
    RunMergeAndInsert
    
End Sub


'Sub SendDocAsMail(control As IRibbonControl)
'
'    Dim oOutlookApp As Outlook.Application
'    Dim oItem As Outlook.MailItem
'
'    On Error Resume Next
'
'    'Start Outlook if it isn't running
'    Set oOutlookApp = GetObject(, "Outlook.Application")
'    If Err <> 0 Then
'        Set oOutlookApp = CreateObject("Outlook.Application")
'    End If
'
'    'Create a new message
'    Set oItem = oOutlookApp.CreateItem(olMailItem)
'
'    'Copy the open document
'    Selection.WholeStory
'    Selection.Copy
'    Selection.End = True
'
'    'Set the WordEditor
'    Dim objInsp As Outlook.Inspector
'    Dim wdEditor As Word.Document
'    Set objInsp = oItem.GetInspector
'    Set wdEditor = objInsp.WordEditor
'
'    'Place the current document into the email body, respecting the user's selection for format
'    If InsertMPContent.optgrpStyle.optRich = True Then
'        wdEditor.Characters(1).PasteAndFormat (wdFormatOriginalFormatting)
'    Else
'        wdEditor.Characters(1).PasteAndFormat (wdFormatPlainText)
'    End If
'
'    'Display the message
'    oItem.Display
'
'    'Clean up
'    Set oItem = Nothing
'    Set oOutlookApp = Nothing
'    Set objInsp = Nothing
'    Set wdEditor = Nothing
'
'    ' Empty the clipboard
'    EmptyClip
'
'End Sub
'Sub SendDocAsEmailAttachment(control As IRibbonControl)
'    Options.SendMailAttach = True
'    ActiveDocument.SendMail
'End Sub
Sub RunMergeAndInsert()
    ' Master function to prepare and perform the mail merge from the MP -exported xlsx file, format it, and
    ' insert it into the current document
    
    ' Launches the InsertMPContent form to allow the user to specify parameters first
    InsertMPContent.Show
    InsertMPContent.txtFilename.Text = ""

End Sub
Sub InsertMergeFields()
'
'   Inserts the mediaportal data source MergeFields into the document, with formatting
'
'
    
    On Error Resume Next
    
    
    ' HEADLINE
    Selection.Style = ActiveDocument.Styles("Heading 3")
    ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="Headline"
    Selection.TypeParagraph
        
    ' META DATA
    Selection.Style = ActiveDocument.Styles("DB_Normal")
    
    ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="Media_Outlet"
    Selection.TypeText Text:=", "
    
    ' SECTION

    ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="ProgramSection_Name"
    Selection.TypeText Text:=", "
    
    ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="Date Date \@ ""dd/MM/yy"""
    
    ' BYLINE (can be author or compere - one is always blank depending on the media type)
    Selection.TypeText Text:=", "
    ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="Author"
    ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="Compere"

    ActiveDocument.MailMerge.Fields.AddIf Range:=Selection.Range, MergeField:= _
        "Page_Number", Comparison:=wdMergeIfIsNotBlank, CompareTo:="", _
        TrueAutoText:="MailMergeInsertIf1", TrueText:=", page ", FalseAutoText:= _
        "MailMergeInsertIf2", FalseText:=""
    ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="Page_Number"
    Selection.TypeParagraph
 
    ' EXTRACT
    Selection.Style = ActiveDocument.Styles("DB_Content")
    ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="Summary"
    Selection.TypeParagraph

    
    ' URL
    Selection.Style = ActiveDocument.Styles("DB_AncillaryInfo")
    ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="Website_URL"
    Selection.TypeParagraph
    
    
    ' URL
    ' Selection.TypeText Text:="Press Clip: "
    ' Selection.Style = ActiveDocument.Styles("DB_AncillaryInfo")
    ' ActiveDocument.MailMerge.Fields.Add Range:=Selection.Range, Name:="Website_URL"
    ' Selection.TypeParagraph
    
    ActiveWindow.View.ShowFieldCodes = Not ActiveWindow.View.ShowFieldCodes

End Sub

Sub DoMPMerge()

    ' On Error Resume Next
    
    ' Ask for a topic, and if supplied, insert & format it
    ' TopicText = InputBox("Enter a title for this Topic. This will appear above the group of inserted media items.", "Topic")
    Dim TopicText As String
    TopicText = InsertMPContent.txtTopic
    
    Selection.Style = ActiveDocument.Styles("Heading 2")
    Selection.TypeText TopicText
    Selection.TypeParagraph
        
    ' Create a new, blank document to insert the merged content into
    ' Uses the specific template to ensure styles / formatting works
    ' Get the user's template path
    Dim strWGTemplates As String
    strWGTemplates = Options.DefaultFilePath(wdWorkgroupTemplatesPath)
    If strWGTemplates = "" Then
        MsgBox ("Your MS Word Workground Templates file location has not been set correctly. Contact I.T.")
        End
    End If
    ' strUserDocsFolder = Environ$("USERPROFILE") & "\My Documents"
    
    Documents.Add Template:= _
        strWGTemplates & "\Daily Briefs\Resources\db_contentmerge_tpl.dotm" _
        , NewTemplate:=False, DocumentType:=0

    ' Get the name of the data source XLS(X) file, from the dialog
    strFileName = InsertMPContent.txtFilename.Text

    ' Setup the various parameters used in the mail merge options
    ' OLD SQL STATEMENT: SQLStatement:="SELECT * FROM `'Mediaportal_Export_28092011 (1)$'`"
    strConnection = "Provider=Microsoft.ACE.OLEDB.12.0;User ID=Admin;Data Source=" & strFileName & ";Mode=Read;Extended Properties=""HDR=YES;IMEX=1;"";Jet OLEDB:System database="""";Jet OLEDB:Registry Path="""";J"

    ActiveDocument.MailMerge.OpenDataSource Name:= _
        strFileName _
        , ConfirmConversions:=False, ReadOnly:=False, LinkToSource:=True, _
        AddToRecentFiles:=False, PasswordDocument:="", PasswordTemplate:="", _
        WritePasswordDocument:="", WritePasswordTemplate:="", Revert:=False, _
        Format:=wdOpenFormatAuto, Connection:=strConnection _
        , SQLStatement:="", _
        SQLStatement1:="", SubType:=wdMergeSubTypeAccess
    ActiveDocument.MailMerge.MainDocumentType = wdCatalog
    
    '   Call the Sub to Insert the Merge Fields
    InsertMergeFields
    
    '   Perform the Merge
    With ActiveDocument.MailMerge
        .Destination = wdSendToNewDocument
        .SuppressBlankLines = True
        With .DataSource
            .FirstRecord = wdDefaultFirstRecord
            .LastRecord = wdDefaultLastRecord
        End With
        .Execute Pause:=False
    End With
    
    ' Clean up formatting on merged content
    ' Double carriage returns
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = "^p^p"
        .Replacement.Text = "^p"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = True
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    ' Pipe characters
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = "|"
        .Replacement.Text = "; "
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = True
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    ' Bylines with NONE as the author / compere
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = ", None, page "
        .Replacement.Text = ", page "
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = True
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    ' Removes the N/A associated with the notes
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = "N/A"
        .Replacement.Text = ""
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = True
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    'Replace 'Other' with 'Online'
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = ", Other,"
        .Replacement.Text = ", Online,"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = True
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll

    'Remove 'None' in the metadata of online items
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = ", None"
        .Replacement.Text = ""
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = True
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    
    'Remove 'None' in the metadata of online items
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = "&#x27;"
        .Replacement.Text = "'"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = True
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    
    'Remove 'None' in the metadata of online items
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = "&#039;"
        .Replacement.Text = "'"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = True
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
     ', Online
    
        
        Selection.Find.ClearFormatting
    Selection.Find.Style = ActiveDocument.Styles("DB_Normal")
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = "( \- *)(, Online)"
        .Replacement.Text = "\2"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = True
        .MatchWildcards = True
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    ' Remove the Hyperlink blue from the lead-in words to each URL
    ' Selection.Find.ClearFormatting
    ' Selection.Find.Replacement.ClearFormatting
    ' Selection.Find.Replacement.Style = ActiveDocument.Styles("DB_Content")
    ' With Selection.Find
    '     .Text = "Press Clip: "
    '     .Replacement.Text = "Press Clip: "
     '    .Forward = True
    '     .Wrap = wdFindContinue
    '     .Format = True
    '     .MatchCase = False
    '     .MatchWholeWord = False
    '     .MatchWildcards = False
    '     .MatchSoundsLike = False
    '     .MatchAllWordForms = False
    ' End With
    ' Selection.Find.Execute Replace:=wdReplaceAll

    ' Copy all the merged text to the clipboard, switch the master document, and paste it in at the insertion point
    Selection.WholeStory
    Selection.Copy
    ActiveDocument.Close (Word.WdSaveOptions.wdDoNotSaveChanges)    ' Close the merge results doc
    ActiveDocument.Close (Word.WdSaveOptions.wdDoNotSaveChanges)    ' Close the merge setup doc
    Selection.PasteAndFormat (wdPasteDefault)                       ' Paste into the active report doc
    
    ' Empty the clipboard
    EmptyClip
    
    ' Set the document language correctly
    Selection.WholeStory
    Selection.LanguageID = wdEnglishAUS
    Selection.NoProofing = False
    Application.CheckLanguage = False
    
    ' Turn off Field Codes
    ActiveWindow.View.ShowFieldCodes = False
    
    ' Convert all URLs to hyperlinks
    URL2Hyperlink
    
End Sub
Sub DecapFirstWords(control As IRibbonControl)
    ' Remove the capitilisation of first 2 words in each paragraph
    Selection.Find.Style = ActiveDocument.Styles("DB_Content")
    With Selection.Find
        .Text = ""
        .Replacement.Text = ""
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    
        Do
           .Execute
            If Not .Found Then
                Exit Do
            ElseIf .Found Then
                On Error Resume Next
                Selection.Words(1).Case = wdTitleSentence
                Selection.Words(2).Case = wdTitleSentence
            End If
        Loop
    End With
End Sub
Sub DecapFirstWords123(control As IRibbonControl)
    ' Remove the capitilisation of first 2 words in each paragraph
    Selection.Find.Style = ActiveDocument.Styles("DB_Content")
    With Selection.Find
        .Text = ""
        .Replacement.Text = ""
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    
        Do
           .Execute
            If Not .Found Then
                Exit Do
            ElseIf .Found Then
                On Error Resume Next
                Selection.Words(1).Case = wdTitleSentence
                Selection.Words(2).Case = wdTitleSentence
            End If
        Loop
    End With
End Sub

Sub TurnHeadsIntoLinks(control As IRibbonControl)
    
    ' Finds the hyperlink for an article, cuts it, and then converts the articles heads (headline or subheads)
    ' into a link using the pasted value
    
 
    Dim txtURL As Variant
    Dim FormDataObj As MSForms.DataObject
    Set FormDataObj = New MSForms.DataObject
    Dim txtLinkText As Variant
    Dim linkCount As Integer
    Dim currLink As Integer
    
    ' Count the number of hyperlinks in the document
    linkCount = 0
    Selection.Find.ClearFormatting
    With Selection.Find
        .Text = ""
        .Replacement.Text = ""
        .Style = ActiveDocument.Styles("DB_AncillaryInfo")
        .Forward = True
        .Wrap = wdFindStop
        Do While .Execute = True
            If .Found Then
                linkCount = linkCount + 1
            ElseIf Not .Found Then
                Exit Do
            End If
        Loop
    End With
    

    ' Now cycle through all links and create new metadata links from them for each article
    For currLink = 1 To linkCount
        
        Selection.Find.ClearFormatting
        With Selection.Find
            .Text = ""
            .Replacement.Text = ""
            .Style = ActiveDocument.Styles("DB_AncillaryInfo")
            .Forward = True
            .Wrap = wdFindContinue
            .Execute
            If Not .Found Then
                Exit For
            ElseIf .Found Then
                ' Copy the URL text to a variable, and delete the URL on the page
                On Error Resume Next
                Selection.Cut
                FormDataObj.GetFromClipboard
                txtURL = FormDataObj.GetText
    
                ' Now, go back to the meta data, select it, and save it to a variable
                Selection.Find.ClearFormatting
                With Selection.Find
                    .Text = ""
                    .Replacement.Text = ""
                    .Style = ActiveDocument.Styles("DB_Normal")
                    .Forward = False
                    .Wrap = wdFindStop
                    .Execute
                End With
                On Error Resume Next
                Selection.Cut
                FormDataObj.GetFromClipboard
                txtLinkText = FormDataObj.GetText
                
                ' Insert the new hyperlink, using the meta data as the title
                Selection.Style = ActiveDocument.Styles("DB_AncillaryInfo")
                ActiveDocument.Hyperlinks.Add Anchor:=Selection.Range, Address:=txtURL, SubAddress:="", ScreenTip:="", TextToDisplay:=txtLinkText
                Selection.TypeParagraph
                Selection.Style = ActiveDocument.Styles("DB_Content")
            End If
        End With
    Next currLink
    
    ' Finally, clean up Word's automatic formatting on hyperlinks
    For currLink = 1 To linkCount
        Selection.Find.ClearFormatting
        With Selection.Find
            .Text = ""
            .Replacement.Text = ""
            .Style = ActiveDocument.Styles("DB_AncillaryInfo")
            .Forward = True
            .Wrap = wdFindContinue
            .Execute
            If Not .Found Then
                Exit For
            ElseIf .Found Then
                Selection.ClearFormatting
            End If
        End With
    Next currLink
    
    Set FormDataObj = Nothing


End Sub


Function GetParNum(r As Range) As Integer
 Dim rParagraphs As Range
 Dim CurPos As Integer

 r.Select
 CurPos = ActiveDocument.Bookmarks("\startOfSel").Start
 Set rParagraphs = ActiveDocument.Range(Start:=0, End:=CurPos)
 GetParNum = rParagraphs.Paragraphs.Count
 End Function


Sub EmptyClip()
    OpenClipboard (0&)
    EmptyClipboard
    CloseClipboard
End Sub

Sub URL2Hyperlink()
  Dim f1 As Boolean, f2 As Boolean, f3 As Boolean
  Dim f4 As Boolean, f5 As Boolean, f6 As Boolean
  Dim f7 As Boolean, f8 As Boolean, f9 As Boolean
  Dim f10 As Boolean
  With Options
    ' Save current AutoFormat settings
    f1 = .AutoFormatApplyHeadings
    f2 = .AutoFormatApplyLists
    f3 = .AutoFormatApplyBulletedLists
    f4 = .AutoFormatApplyOtherParas
    f5 = .AutoFormatReplaceQuotes
    f6 = .AutoFormatReplaceSymbols
    f7 = .AutoFormatReplaceOrdinals
    f8 = .AutoFormatReplaceFractions
    f9 = .AutoFormatReplacePlainTextEmphasis
    f10 = .AutoFormatReplaceHyperlinks
    ' Only convert URLs
    .AutoFormatApplyHeadings = False
    .AutoFormatApplyLists = False
    .AutoFormatApplyBulletedLists = False
    .AutoFormatApplyOtherParas = False
    .AutoFormatReplaceQuotes = False
    .AutoFormatReplaceSymbols = False
    .AutoFormatReplaceOrdinals = False
    .AutoFormatReplaceFractions = False
    .AutoFormatReplacePlainTextEmphasis = False
    .AutoFormatReplaceHyperlinks = True
    .AutoFormatAsYouTypeApplyHeadings = False
    .AutoFormatAsYouTypeApplyBorders = False
    .AutoFormatAsYouTypeApplyTables = False
    .AutoFormatAsYouTypeReplacePlainTextEmphasis = False
    .AutoFormatAsYouTypeDefineStyles = False
    
        .AutoFormatAsYouTypeApplyHeadings = False
        .AutoFormatAsYouTypeApplyBorders = False
        .AutoFormatAsYouTypeApplyBulletedLists = False
        .AutoFormatAsYouTypeApplyNumberedLists = False
        .AutoFormatAsYouTypeApplyTables = False
        .AutoFormatAsYouTypeReplacePlainTextEmphasis = False
        .AutoFormatAsYouTypeDefineStyles = False
        .AutoFormatApplyHeadings = False
        .AutoFormatApplyLists = False
        .AutoFormatApplyBulletedLists = False
        .AutoFormatApplyOtherParas = False
        .AutoFormatReplacePlainTextEmphasis = False
        .AutoFormatPreserveStyles = True
        .AutoFormatPlainTextWordMail = False
        
    ' Perform AutoFormat
    ActiveDocument.Content.AutoFormat
    
    ' Restore original AutoFormat settings
    .AutoFormatReplaceQuotes = f5
    .AutoFormatReplaceSymbols = f6
    .AutoFormatReplaceOrdinals = f7
    .AutoFormatReplaceFractions = f8
    .AutoFormatReplaceHyperlinks = f10
  End With
  
  ' Now, convert all to just display the "read more" text
    'Dim HL As Hyperlink
    'For Each HL In ActiveDocument.Hyperlinks
    '    HL.TextToDisplay = "View original article"
    'Next
  
End Sub

Sub SaveAsCleanDoc(control As IRibbonControl)
    
    ' Creates a new document and inserts the contents into it, effectively removing the macros, and
    ' prompts the users to choose a save as name
    Selection.WholeStory
    Selection.Copy
    
    ' Create a new, blank document to create the clean document from
    ' Uses the specific template to ensure styles / formatting works
    ' Get the user's template path
    Dim strWGTemplates As String
    strWGTemplates = Options.DefaultFilePath(wdWorkgroupTemplatesPath)
    If strWGTemplates = "" Then
        MsgBox ("Your MS Word Workground Templates file location has not been set correctly. Contact I.T.")
        End
    End If
     Documents.Add Template:= _
        strWGTemplates & "\Daily Briefs\Resources\db_cleanfile.dotx" _
        , NewTemplate:=False, DocumentType:=0
    
    ' Paste the content into the new, clean file
    Selection.PasteAndFormat (wdPasteDefault)
    
    ' Turn off Field Codes
    ActiveWindow.View.ShowFieldCodes = False
    
    With Application.Dialogs(wdDialogFileSaveAs)
        .Name = "Daily Brief.docx"
        .Format = wdFormatDocument
        .Show
    End With
    
    ' Empty the clipboard
    EmptyClip
    
    ' ActiveDocument.SaveAs FileName:="Friday.docx", FileFormat:= _
     '   wdFormatXMLDocument, LockComments:=False, Password:="", AddToRecentFiles _
     '   :=True, WritePassword:="", ReadOnlyRecommended:=False, EmbedTrueTypeFonts _
     '   :=False, SaveNativePictureFormat:=False, SaveFormsData:=False, _
    '    SaveAsAOCELetter:=False
    
End Sub


Sub SendDocAsMail(control As IRibbonControl)

    Dim oOutlookApp As Outlook.Application
    Dim oItem As Outlook.MailItem

    ' On Error Resume Next
    
    ' Prepare the email subject line - find the text set in Heading 1 and use that as the default
    Dim SubjectLine As String
    SubjectLine = "Your Daily Brief"  ' Default subject line
    ' Find the Heading 1 text
    Selection.Find.ClearFormatting
    Selection.Find.Style = ActiveDocument.Styles("Heading 1")
    With Selection.Find
        .Text = ""
        .Replacement.Text = ""
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = False
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute
    ' Save the selected text to the subjectline variable
    Dim selectedRange As Range
    Set selectedRange = ActiveDocument.Range(Selection.Range.Start, Selection.Range.End)
    SubjectLine = selectedRange.Text

    'Start Outlook if it isn't running
    Set oOutlookApp = GetObject(, "Outlook.Application")
    If Err <> 0 Then
        Set oOutlookApp = CreateObject("Outlook.Application")
    End If

    'Create a new message
    Set oItem = oOutlookApp.CreateItem(olMailItem)
    
    Dim todayDate As Date
    todayDate = Now()
    strDateMessage = Format(todayDate, "dddd dd mmmm yyyy")
    
    'Copy the open document
    Selection.WholeStory
    Selection.Copy
    Selection.End = True

    'Set the WordEditor
    Dim objInsp As Outlook.Inspector
    Dim wdEditor As Word.Document
    Set objInsp = oItem.GetInspector
    Set wdEditor = objInsp.WordEditor

    'Place the current document into the email body in plain text
    ' wdEditor.Characters(1).PasteAndFormat (wdFormatPlainText)
    wdEditor.Characters(1).PasteAndFormat (wdFormatOriginalFormatting)


    'Format & display the message
     With oItem
        .To = ""
        .CC = ""
        .BCC = "dailybriefings001@gmail.com; cae@isentia.com; AllGovernmentBriefing@isentia.com; Catherine.Mcdonald@infrastructure.gov.au; Fiona.Sugden@aph.gov.au; Matthew.Franklin@aph.gov.au; Annie.Williams@aph.gov.au; Timothy.Dunlop@aph.gov.au; Kate.Hanns@aph.gov.au; Daryl.Tan@aph.gov.au; Senator.Ciccone@aph.gov.au; Leila.Stennett@aph.gov.au; sophie.sharpe@homeaffairs.gov.au; john.ewart@isentia.com; nbt@isentia.com; Kevin.Donnellan@ag.gov.au; Grant.Taylor@ag.gov.au; jodi.staunton-smith@premiers.qld.gov.au; mediareporters@premiers.qld.gov.au; bec.ellis@isentia.com; brett.kolodziej@isentia.com; natasha.bartak@isentia.com"
        .Subject = "Front Pages Daily Briefing " & strDateMessage
        ' .BodyFormat = olFormatHTML
        .Display
    End With

    'Clean up
    Set oItem = Nothing
    Set oOutlookApp = Nothing
    Set objInsp = Nothing
    Set wdEditor = Nothing

    ' Empty the clipboard
    EmptyClip

End Sub
Sub SwitchDates(control As IRibbonControl)
   
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = ", (1[012])\/([01][0-9])"
        .Replacement.Text = ", \2///\1"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = True
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = ", (0[0-9])\/([01][0-9])"
        .Replacement.Text = ", \2/\1"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = True
        .MatchSoundsLike = False
        .MatchAllWordForms = False
        
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = "///"
        .Replacement.Text = "/"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = True
        .MatchSoundsLike = False
        .MatchAllWordForms = False
        
    End With
    Selection.Find.Execute Replace:=wdReplaceAll

End Sub

Sub SwitchDates1()
   
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = ", (1[012])\/([01][0-9])"
        .Replacement.Text = ", \2///\1"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = True
        .MatchSoundsLike = False
        .MatchAllWordForms = False
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = ", (0[0-9])\/([01][0-9])"
        .Replacement.Text = ", \2/\1"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = True
        .MatchSoundsLike = False
        .MatchAllWordForms = False
        
    End With
    Selection.Find.Execute Replace:=wdReplaceAll
    
    Selection.Find.ClearFormatting
    Selection.Find.Replacement.ClearFormatting
    With Selection.Find
        .Text = "///"
        .Replacement.Text = "/"
        .Forward = True
        .Wrap = wdFindContinue
        .Format = True
        .MatchCase = False
        .MatchWholeWord = False
        .MatchWildcards = True
        .MatchSoundsLike = False
        .MatchAllWordForms = False
        
    End With
    Selection.Find.Execute Replace:=wdReplaceAll

End Sub


