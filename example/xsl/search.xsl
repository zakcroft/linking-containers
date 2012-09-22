<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
  <xsl:output method="html" encoding="utf-8"/>

  <!-- Declare velocity parameters -->
  <xsl:param name="context_path"/>
  <xsl:param name="current_path"/>

  <xsl:template match="/">
  <!--xsl:if test="contains($context_path,'vyre4')"><textarea><xsl:copy-of select="*" /></textarea></xsl:if-->
    <xsl:apply-templates select="search-results/items"/>
  </xsl:template>

  <xsl:template match="items">
    <ul id="searchContainer" class="connected">
      <xsl:apply-templates select="file-item"/>
    </ul>
  </xsl:template>

  <xsl:template match="file-item">
    <li class="itemId-{@id}">    
       item:<xsl:value-of select="@id" /> 
      <xsl:apply-templates select="." mode="details"/>
     <a href="#" class="add"></a>
    </li>
  </xsl:template>

  <xsl:template match="*" mode="details">
    <h3>
      <a href="{$current_path}/view/item{@id}">
        <!--xsl:value-of select="name" disable-output-escaping="yes"/-->
      </a>
    </h3>
  </xsl:template>

</xsl:stylesheet>
